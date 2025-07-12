// ai-mcp-server.js - TathminiAI Analysis Server
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Available analysis types
const ANALYSIS_TYPES = {
    DESCRIPTIVE: 'descriptive',
    TREND: 'trend',
    QUALITY: 'quality',
    RECOMMENDATIONS: 'recommendations',
    SUMMARY: 'summary'
};

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'TathminiAI Analysis Server' });
});

// Main analysis endpoint
app.post('/api/analyze', async (req, res) => {
    try {
        const {
            data,
            analysisType = ANALYSIS_TYPES.SUMMARY,
            researchObjectives = [],
            context = {}
        } = req.body;

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid data format. Expected array of submissions.'
            });
        }

        console.log(`Analyzing ${data.length} submissions for ${analysisType} analysis...`);

        // Prepare data for AI analysis
        const analysisRequest = prepareAnalysisRequest(data, analysisType, researchObjectives, context);
        
        // Call OpenRouter AI
        const aiResponse = await callOpenRouter(analysisRequest);
        
        // Process and structure the response
        const structuredAnalysis = processAIResponse(aiResponse, analysisType);

        res.json({
            success: true,
            analysisType,
            submissionsAnalyzed: data.length,
            timestamp: new Date().toISOString(),
            analysis: structuredAnalysis,
            metadata: {
                model: 'claude-3-haiku',
                objectives: researchObjectives
            }
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Batch analysis endpoint
app.post('/api/analyze-batch', async (req, res) => {
    try {
        const { data, analysisTypes = Object.values(ANALYSIS_TYPES), researchObjectives } = req.body;

        const results = {};
        
        for (const type of analysisTypes) {
            const request = prepareAnalysisRequest(data, type, researchObjectives);
            const aiResponse = await callOpenRouter(request);
            results[type] = processAIResponse(aiResponse, type);
        }

        res.json({
            success: true,
            analysisTypes,
            submissionsAnalyzed: data.length,
            timestamp: new Date().toISOString(),
            results
        });

    } catch (error) {
        console.error('Batch analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper function to prepare analysis request
function prepareAnalysisRequest(data, analysisType, objectives, context = {}) {
    // Calculate basic statistics
    const stats = calculateBasicStats(data);
    
    // Create prompt based on analysis type
    let prompt = '';
    
    switch (analysisType) {
        case ANALYSIS_TYPES.DESCRIPTIVE:
            prompt = `Analyze this ODK research data and provide descriptive statistics with insights:
            
Data Summary:
- Total submissions: ${stats.total}
- Complete submissions: ${stats.complete}
- Average quality score: ${stats.avgQuality}%
- Date range: ${stats.dateRange}

Research Objectives:
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Provide:
1. Key descriptive statistics
2. Data distribution insights
3. Notable patterns
4. Data quality assessment`;
            break;

        case ANALYSIS_TYPES.TREND:
            prompt = `Analyze temporal trends in this ODK research data:
            
${JSON.stringify(stats, null, 2)}

Identify:
1. Submission patterns over time
2. Quality score trends
3. Completion rate changes
4. Seasonal or periodic patterns`;
            break;

        case ANALYSIS_TYPES.QUALITY:
            prompt = `Assess the data quality of these ODK submissions:
            
${JSON.stringify(stats, null, 2)}

Evaluate:
1. Overall data quality score
2. Common data issues
3. Completeness analysis
4. Recommendations for improvement`;
            break;

        case ANALYSIS_TYPES.RECOMMENDATIONS:
            prompt = `Based on this ODK research data, provide actionable recommendations:
            
${JSON.stringify(stats, null, 2)}

Research Objectives:
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Provide:
1. Key findings
2. Actionable recommendations
3. Areas for improvement
4. Next steps for research`;
            break;

        case ANALYSIS_TYPES.SUMMARY:
        default:
            prompt = `Provide a comprehensive analysis summary of this ODK research data:
            
${JSON.stringify(stats, null, 2)}

Include:
1. Executive summary
2. Key findings
3. Data quality assessment
4. Recommendations
5. Areas needing attention`;
    }

    // Add sample data if needed
    if (data.length > 0 && data.length <= 5) {
        prompt += `\n\nSample submissions:\n${JSON.stringify(data.slice(0, 5), null, 2)}`;
    }

    return prompt;
}

// Helper function to calculate basic statistics
function calculateBasicStats(data) {
    if (!data || data.length === 0) {
        return {
            total: 0,
            complete: 0,
            incomplete: 0,
            avgQuality: 0,
            dateRange: 'No data'
        };
    }

    const completeCount = data.filter(d => d.isComplete || d.reviewState !== 'rejected').length;
    const qualityScores = data.map(d => parseFloat(d.qualityScore) || 0);
    const avgQuality = qualityScores.length > 0 
        ? (qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length).toFixed(1)
        : 0;

    const dates = data.map(d => new Date(d.createdAt || d.processedAt)).filter(d => !isNaN(d));
    const dateRange = dates.length > 0
        ? `${new Date(Math.min(...dates)).toLocaleDateString()} - ${new Date(Math.max(...dates)).toLocaleDateString()}`
        : 'No valid dates';

    return {
        total: data.length,
        complete: completeCount,
        incomplete: data.length - completeCount,
        avgQuality,
        dateRange,
        submissionIds: data.map(d => d.submissionId || d.instanceId).filter(Boolean)
    };
}

// Helper function to call OpenRouter
async function callOpenRouter(prompt) {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://tathmini.ai',
            'X-Title': 'TathminiAI Analysis'
        },
        body: JSON.stringify({
            model: 'anthropic/claude-3-haiku',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert research analyst specializing in ODK data analysis for health and social research in Kenya. Provide clear, actionable insights in plain language.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${error}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
}

// Helper function to process AI response
function processAIResponse(aiResponse, analysisType) {
    // Structure the response based on analysis type
    const structured = {
        type: analysisType,
        content: aiResponse,
        generatedAt: new Date().toISOString()
    };

    // Try to extract key points (basic parsing)
    const lines = aiResponse.split('\n').filter(line => line.trim());
    const keyPoints = [];
    const recommendations = [];

    lines.forEach(line => {
        if (line.match(/^\d+\.|^-|^•/)) {
            if (line.toLowerCase().includes('recommend') || line.toLowerCase().includes('should')) {
                recommendations.push(line.replace(/^\d+\.|^-|^•/, '').trim());
            } else {
                keyPoints.push(line.replace(/^\d+\.|^-|^•/, '').trim());
            }
        }
    });

    structured.keyPoints = keyPoints.slice(0, 5);
    structured.recommendations = recommendations.slice(0, 5);

    return structured;
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🧠 TathminiAI Analysis Server running on port ${PORT}`);
    console.log(`📊 Ready to analyze ODK research data with AI`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});