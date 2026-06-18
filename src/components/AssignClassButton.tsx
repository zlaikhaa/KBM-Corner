import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { UserPlus, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';

interface AssignClassButtonProps {
  member: any;
  onAssigned: () => void;
}

export function AssignClassButton({ member, onAssigned }: AssignClassButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>(member.assignedClass || '');
  const [loading, setLoading] = useState(false);

  const classes = [
    { code: 'HYB01', level: 1, name: 'Level 1 - Beginner' },
    { code: 'HYB02', level: 2, name: 'Level 2 - Elementary' },
    { code: 'HYB03', level: 3, name: 'Level 3 - Intermediate' },
    { code: 'HYB04', level: 4, name: 'Level 4 - Upper Intermediate' },
    { code: 'HYB05', level: 5, name: 'Level 5 - Advanced' },
  ];

  const handleAssign = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      const classData = classes.find(c => c.code === selectedClass);
      if (!classData) return;

      await api.assignClassToTutor(member.id, selectedClass, classData.level);
      alert(`Successfully assigned ${member.name} to ${selectedClass}!`);
      setOpen(false);
      onAssigned();
    } catch (error) {
      console.error('Failed to assign class:', error);
      alert('Failed to assign class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={member.assignedClass ? 'outline' : 'default'}>
          {member.assignedClass ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {member.assignedClass}
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Class
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Class to Tutor</DialogTitle>
          <DialogDescription>
            Assign {member.name} to a specific class (HYB01-HYB05)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>Tutor:</strong> {member.name}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {member.assignedClass 
                ? `Currently assigned to ${member.assignedClass}`
                : 'Not yet assigned to any class'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class-select">Select Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class-select">
                <SelectValue placeholder="Choose a class..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.code} value={cls.code}>
                    {cls.code} - {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Each class corresponds to a specific Mandarin proficiency level
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedClass || loading}
            >
              {loading ? 'Assigning...' : 'Assign Class'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
