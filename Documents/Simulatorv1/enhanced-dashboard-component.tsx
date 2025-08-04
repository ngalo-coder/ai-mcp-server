import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Grid,
  Typography,
  Avatar,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  TrendingUp,
  Award,
  Clock,
  Target,
  Flame,
  BookOpen,
  Brain,
  Stethoscope,
  MessageCircle,
  CheckCircle,
  Star,
  BarChart3,
  Lightbulb,
} from '@mui/icons-material';

// Enhanced Dashboard Component with Rich Content
const EnhancedUserDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [timeOfDay, setTimeOfDay] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    // Determine time of day for personalized greeting
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 17) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');

    // Load dashboard data (mock data for demonstration)
    setDashboardData({
      streak: 5,
      longestStreak: 12,
      weeklyGoal: { completed: 3, target: 5, specialty: 'Emergency Medicine' },
      totalCases: 24,
      averageScore: 82.5,
      currentLevel: 'Intermediate',
      skillScores: {
        historyTaking: 85,
        physicalExam: 78,
        diagnosis: 82,
        communication: 90,
        clinicalReasoning: 75
      },
      recentActivities: [
        {
          type: 'completed',
          title: 'Completed Chest Pain Case',
          description: 'Scored 85% in Emergency Medicine',
          timeAgo: '2 hours ago'
        },
        {
          type: 'achievement',
          title: 'Earned "Diagnostic Expert" Badge',
          description: '5 consecutive cases with 90+ scores',
          timeAgo: '1 day ago'
        },
        {
          type: 'started',
          title: 'Started Pediatric Module',
          description: 'Beginning specialized training',
          timeAgo: '3 days ago'
        }
      ],
      weeklyInsights: {
        casesCompleted: 7,
        avgScore: 84,
        timeSpent: 12,
        improvements: [
          'Communication skills improved by 15%',
          'Diagnostic accuracy increased to 85%'
        ],
        challenges: [
          'Focus on physical examination techniques',
          'Practice differential diagnosis reasoning'
        ]
      }
    });
  }, []);

  const getPersonalizedGreeting = () => {
    const greetings = {
      morning: `Good morning, Dr. ${currentUser?.username || 'Clinician'}! Ready to enhance your clinical skills today?`,
      afternoon: `Good afternoon, Dr. ${currentUser?.username || 'Clinician'}! Perfect time to sharpen your diagnostic skills.`,
      evening: `Good evening, Dr. ${currentUser?.username || 'Clinician'}! Wind down with some simulation practice.`
    };
    return greetings[timeOfDay] || greetings.morning;
  };

  if (!dashboardData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography>Loading your personalized dashboard...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Personalized Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {getPersonalizedGreeting()}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Continue your journey to clinical excellence
        </Typography>
      </Box>

      {/* Top Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Daily Streak Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <Flame sx={{ color: 'white' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {dashboardData.streak}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.9)">
                    Day streak
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.7)">
                    Best: {dashboardData.longestStreak} days
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="white" sx={{ mt: 2, fontWeight: 500 }}>
                {dashboardData.streak === 0 ? "Start your learning streak today!" :
                 dashboardData.streak < 3 ? "Great start! Keep it going!" :
                 dashboardData.streak < 7 ? "You're on fire! 🔥" :
                 "Incredible dedication! 🌟"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Goal Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight="bold">Weekly Goal</Typography>
                <Target color="primary" />
              </Box>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">
                    {dashboardData.weeklyGoal.completed}/{dashboardData.weeklyGoal.target} cases
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {Math.round((dashboardData.weeklyGoal.completed / dashboardData.weeklyGoal.target) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(dashboardData.weeklyGoal.completed / dashboardData.weeklyGoal.target) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Focus: {dashboardData.weeklyGoal.specialty}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Cases */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <BookOpen />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {dashboardData.totalCases}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cases Completed
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {dashboardData.totalCases > 20 ? "Excellent progress!" :
                 dashboardData.totalCases > 10 ? "Great job!" :
                 "Keep practicing!"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Average Score */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {dashboardData.averageScore}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {dashboardData.averageScore >= 90 ? "Outstanding!" :
                 dashboardData.averageScore >= 80 ? "Very good!" :
                 dashboardData.averageScore >= 70 ? "Good work!" :
                 "Keep improving!"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Skills Progress */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', height: '100%' }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUp color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Your Clinical Skills Journey
                  </Typography>
                </Box>
              }
            />
            <CardContent>
              <Box sx={{ space: 3 }}>
                {[
                  { name: 'History Taking', score: dashboardData.skillScores.historyTaking, icon: MessageCircle },
                  { name: 'Physical Exam', score: dashboardData.skillScores.physicalExam, icon: Stethoscope },
                  { name: 'Diagnosis', score: dashboardData.skillScores.diagnosis, icon: Brain },
                  { name: 'Communication', score: dashboardData.skillScores.communication, icon: MessageCircle },
                  { name: 'Clinical Reasoning', score: dashboardData.skillScores.clinicalReasoning, icon: Lightbulb }
                ].map((skill, index) => (
                  <Box key={skill.name} sx={{ mb: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <skill.icon sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight="medium">
                          {skill.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {skill.score}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={skill.score}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: skill.score >= 90 ? 'success.main' :
                                         skill.score >= 80 ? 'primary.main' :
                                         skill.score >= 70 ? 'warning.main' : 'error.main'
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', height: '100%' }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <Clock color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Recent Activity
                  </Typography>
                </Box>
              }
            />
            <CardContent>
              <Box sx={{ space: 2 }}>
                {dashboardData.recentActivities.map((activity, index) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 2, 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: 'grey.50',
                    mb: 2
                  }}>
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: activity.type === 'completed' ? 'success.main' :
                               activity.type === 'achievement' ? 'warning.main' : 'primary.main'
                    }}>
                      {activity.type === 'completed' && <CheckCircle sx={{ fontSize: 16 }} />}
                      {activity.type === 'achievement' && <Award sx={{ fontSize: 16 }} />}
                      {activity.type === 'started' && <PlayArrow sx={{ fontSize: 16 }} />}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {activity.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {activity.timeAgo}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardHeader
              title={
                <Typography variant="h6" fontWeight="bold">
                  Quick Actions
                </Typography>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ 
                      height: 80, 
                      flexDirection: 'column', 
                      gap: 1,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #3f51b5 30%, #2196f3 90%)'
                    }}
                    onClick={() => navigate('/select-program')}
                  >
                    <PlayArrow />
                    <Typography variant="caption">Start Case</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ 
                      height: 80, 
                      flexDirection: 'column', 
                      gap: 1,
                      borderRadius: 2
                    }}
                    onClick={() => navigate('/practice-mode')}
                  >
                    <Brain />
                    <Typography variant="caption">Practice Mode</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ 
                      height: 80, 
                      flexDirection: 'column', 
                      gap: 1,
                      borderRadius: 2
                    }}
                    onClick={() => navigate('/review-cases')}
                  >
                    <BookOpen />
                    <Typography variant="caption">Review Cases</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ 
                      height: 80, 
                      flexDirection: 'column', 
                      gap: 1,
                      borderRadius: 2
                    }}
                    onClick={() => navigate('/study-guide')}
                  >
                    <BarChart3 />
                    <Typography variant="caption">Analytics</Typography>
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Insights */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <BarChart3 color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    This Week's Insights
                  </Typography>
                </Box>
              }
            />
            <CardContent>
              {/* Key Metrics */}
              <Grid container spacing={2} sx={{ mb: 3, textAlign: 'center' }}>
                <Grid item xs={4}>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    {dashboardData.weeklyInsights.casesCompleted}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cases Completed
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {dashboardData.weeklyInsights.avgScore}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Average Score
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {dashboardData.weeklyInsights.timeSpent}h
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Time Practiced
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              {/* Improvements */}
              {dashboardData.weeklyInsights.improvements.length > 0 && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                    🎉 Improvements
                  </Typography>
                  {dashboardData.weeklyInsights.improvements.map((improvement, index) => (
                    <Typography key={index} variant="body2" color="success.dark">
                      • {improvement}
                    </Typography>
                  ))}
                </Box>
              )}

              {/* Challenges */}
              {dashboardData.weeklyInsights.challenges.length > 0 && (
                <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                  <Typography variant="subtitle2" color="warning.main" fontWeight="bold" sx={{ mb: 1 }}>
                    💪 Areas to Focus
                  </Typography>
                  {dashboardData.weeklyInsights.challenges.map((challenge, index) => (
                    <Typography key={index} variant="body2" color="warning.dark">
                      • {challenge}
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EnhancedUserDashboard;