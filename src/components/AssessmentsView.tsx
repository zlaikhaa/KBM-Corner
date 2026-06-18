import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { FileText, ClipboardCheck, Calendar, Trophy, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { api } from '../lib/api';

interface AssessmentsViewProps {
  assessments: any[];
  submissions: any[];
  userLevel: number;
  onAssessmentComplete: () => void;
}

export function AssessmentsView({ assessments, submissions, userLevel, onAssessmentComplete }: AssessmentsViewProps) {
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [currentAnswers, setCurrentAnswers] = useState<{ [key: number]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const levelAssessments = (assessments || []).filter(a => a.level === userLevel);
  const quizzes = levelAssessments.filter(a => a.type === 'quiz');
  const exams = levelAssessments.filter(a => a.type === 'exam');

  const getSubmissionForAssessment = (assessmentId: string) => {
    return (submissions || []).find(s => s.assessmentId === assessmentId);
  };

  const calculateScore = () => {
    let correct = 0;
    selectedAssessment.questions.forEach((q: any, index: number) => {
      if (currentAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return (correct / selectedAssessment.questions.length) * 100;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const score = calculateScore();
      const answers = Object.values(currentAnswers);
      
      await api.submitAssessment(selectedAssessment.id, answers, score);
      
      setSelectedAssessment(null);
      setCurrentAnswers({});
      onAssessmentComplete();
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const AssessmentCard = ({ assessment, type }: { assessment: any; type: string }) => {
    const submission = getSubmissionForAssessment(assessment.id);
    const isPast = new Date(assessment.dueDate) < new Date();
    const isCompleted = !!submission;
    const hasPassed = submission?.passed;

    return (
      <Card key={assessment.id}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg">{assessment.title}</CardTitle>
                {type === 'exam' && <Trophy className="w-4 h-4 text-yellow-600" />}
              </div>
              <CardDescription>
                Level {assessment.level} • {assessment.questions.length} questions • Passing: {assessment.passingScore}%
              </CardDescription>
            </div>
            <Badge variant={
              isCompleted && hasPassed ? 'default' :
              isCompleted && !hasPassed ? 'destructive' :
              isPast ? 'secondary' : 'outline'
            }>
              {isCompleted && hasPassed ? 'Passed' :
               isCompleted && !hasPassed ? 'Failed' :
               isPast ? 'Overdue' : 'Pending'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Due: {new Date(assessment.dueDate).toLocaleDateString()}</span>
            </div>
          </div>

          {isCompleted && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Score</span>
                <span className="text-lg font-bold">{submission.score}%</span>
              </div>
              <Progress value={submission.score} className="h-2" />
              {submission.passed ? (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <ClipboardCheck className="w-3 h-3" />
                  Congratulations! You passed this {type}.
                </p>
              ) : (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  You need {assessment.passingScore}% to pass. Please try again.
                </p>
              )}
            </div>
          )}

          {!isCompleted && (
            <Button 
              onClick={() => setSelectedAssessment(assessment)}
              className="w-full"
              variant={isPast ? 'outline' : 'default'}
            >
              <FileText className="w-4 h-4 mr-2" />
              Start {type === 'quiz' ? 'Quiz' : 'Exam'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Quizzes */}
      <div>
        <h3 className="text-xl mb-4 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-blue-600" />
          Quizzes - Level {userLevel}
        </h3>
        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No quizzes available for your current level
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {quizzes.map(quiz => (
              <AssessmentCard key={quiz.id} assessment={quiz} type="quiz" />
            ))}
          </div>
        )}
      </div>

      {/* Exams */}
      <div>
        <h3 className="text-xl mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Exam - Level {userLevel}
        </h3>
        {exams.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No exams available for your current level
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exams.map(exam => (
              <AssessmentCard key={exam.id} assessment={exam} type="exam" />
            ))}
          </div>
        )}
      </div>

      {/* Assessment Dialog */}
      {selectedAssessment && (
        <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedAssessment.title}</DialogTitle>
              <DialogDescription>
                Answer all questions. You need {selectedAssessment.passingScore}% to pass.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {selectedAssessment.questions.map((question: any, index: number) => (
                <div key={index} className="space-y-3 pb-4 border-b last:border-b-0">
                  <h4 className="font-medium">
                    {index + 1}. {question.question}
                  </h4>
                  <RadioGroup
                    value={currentAnswers[index] || ''}
                    onValueChange={(value) => {
                      setCurrentAnswers({ ...currentAnswers, [index]: value });
                    }}
                  >
                    {question.options.map((option: string, optIndex: number) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`q${index}-o${optIndex}`} />
                        <Label htmlFor={`q${index}-o${optIndex}`} className="cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedAssessment(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={
                  isSubmitting || 
                  Object.keys(currentAnswers).length < selectedAssessment.questions.length
                }
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
