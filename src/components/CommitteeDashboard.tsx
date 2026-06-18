import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar as CalendarIcon, LogOut, Plus, Edit, Trash2, QrCode, Users, CheckCircle, GraduationCap } from 'lucide-react';
import { api } from '../lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { QRCodeGenerator } from './QRCodeGenerator';
import { AssignClassButton } from './AssignClassButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import clubLogo from 'figma:asset/ade13b6fb51eb9b3ff7200cf4269cebe703dd1ea.png';

interface CommitteeDashboardProps {
  user: any;
  onLogout: () => void;
}

export function CommitteeDashboard({ user, onLogout }: CommitteeDashboardProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventType, setEventType] = useState('event');

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 10 seconds to detect new tutors
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing committee dashboard...');
      loadData();
    }, 10000); // 10 seconds

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('user_profile_') || e.key === 'events')) {
        console.log('LocalStorage changed, refreshing committee dashboard...');
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('=== COMMITTEE DASHBOARD DEBUG ===');
      
      const [eventsData, usersData] = await Promise.all([
        api.getEvents().catch(err => { 
          console.error('Events error:', err); 
          return { events: [] }; 
        }),
        api.getAllUsers().catch(err => {
          console.error('Users error:', err);
          return { users: [] };
        })
      ]);
      
      console.log('All users fetched:', usersData.users);
      console.log('Total users count:', usersData.users?.length || 0);
      
      // Filter only event-type events (not classes)
      const clubEvents = (eventsData.events || []).filter((e: any) => e.type === 'event');
      setEvents(clubEvents);
      
      // Get all tutors
      const allTutors = (usersData.users || []).filter((u: any) => u.role === 'tutor');
      console.log('Filtered tutors:', allTutors);
      console.log('Total tutors count:', allTutors.length);
      setTutors(allTutors);
      
      // Calculate committee-specific stats from the data we have
      setStats({
        totalEvents: clubEvents.length,
        upcomingEvents: clubEvents.filter((e: any) => new Date(e.date) >= new Date()).length,
        totalTutors: allTutors.length,
        assignedTutors: allTutors.filter((t: any) => t.assignedClass).length
      });
      
      console.log('=== END DEBUG ===');
    } catch (error) {
      console.error('Failed to load committee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEventDialog = (event?: any) => {
    if (event) {
      setEditingEvent(event);
      setEventTitle(event.title);
      setEventDescription(event.description);
      setEventDate(event.date);
      setEventTime(event.time);
      setEventVenue(event.venue);
      setEventType(event.type);
    } else {
      setEditingEvent(null);
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setEventTime('');
      setEventVenue('');
      setEventType('event');
    }
    setShowEventDialog(true);
  };

  const handleSaveEvent = async () => {
    try {
      const eventData = {
        title: eventTitle,
        description: eventDescription,
        date: eventDate,
        time: eventTime,
        venue: eventVenue,
        type: eventType
      };

      if (editingEvent) {
        await api.updateEvent(editingEvent.id, eventData);
      } else {
        await api.createEvent(eventData);
      }

      setShowEventDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await api.deleteEvent(eventId);
      loadData();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event');
    }
  };

  const handleGenerateEventQR = (event: any) => {
    setSelectedEvent(event);
    setShowQRCode(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={clubLogo} alt="UTM Mandarin Club" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl">UTM Mandarin Club - Committee</h1>
                <p className="text-sm text-gray-600">Welcome, {user.user_metadata?.name}!</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="events" className="space-y-6">
          {/* Tabs Navigation */}
          <TabsList>
            <TabsTrigger value="events">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="tutors">
              <GraduationCap className="w-4 h-4 mr-2" />
              Tutors
              <Badge variant="secondary" className="ml-2">{tutors.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">Total Events</CardTitle>
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl">{events.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">Total RSVPs</CardTitle>
                  <Users className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl">{stats?.totalRSVPs || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">Event Attendance</CardTitle>
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl">{stats?.totalAttendance || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Events Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl">Events Management</h2>
                  <p className="text-gray-600">Create and manage club events. Generate QR codes for event attendance.</p>
                </div>
                <Button onClick={() => openEventDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>

              <div className="grid gap-4">
                {events.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      No events created yet. Click "Create Event" to get started!
                    </CardContent>
                  </Card>
                ) : (
                  events.map((event) => (
                    <Card key={event.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle>{event.title}</CardTitle>
                              <Badge>{event.type}</Badge>
                            </div>
                            <CardDescription>{event.description}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => handleGenerateEventQR(event)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <QrCode className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEventDialog(event)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Date</p>
                            <p>{new Date(event.date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Time</p>
                            <p>{event.time}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Venue</p>
                            <p>{event.venue}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Session Code</p>
                            <p className="font-mono bg-red-50 text-red-600 px-2 py-1 rounded inline-block">{event.sessionCode}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tutors Tab */}
          <TabsContent value="tutors" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">Total Tutors</CardTitle>
                  <GraduationCap className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl">{stats?.totalTutors || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">Assigned Classes</CardTitle>
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl">{stats?.assignedTutors || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats?.totalTutors > 0 
                      ? `${Math.round((stats.assignedTutors / stats.totalTutors) * 100)}% assigned`
                      : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">Available Classes</CardTitle>
                  <Users className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl">5</p>
                  <p className="text-xs text-gray-500 mt-1">HYB01 - HYB05</p>
                </CardContent>
              </Card>
            </div>

            {/* Tutors Management */}
            <Card>
              <CardHeader>
                <CardTitle>Tutor Class Assignments</CardTitle>
                <CardDescription>Assign tutors to classes (HYB01-HYB05) for different Mandarin proficiency levels</CardDescription>
              </CardHeader>
              <CardContent>
                {tutors.length === 0 ? (
                  <div className="text-center py-8">
                    <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="font-medium text-gray-600">No Tutors Yet</p>
                    <p className="text-sm text-gray-500">Tutors need to sign up and be verified by admin first</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tutors.map((tutor) => (
                      <div key={tutor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{tutor.name}</p>
                          <p className="text-sm text-gray-600">{tutor.email}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant={tutor.verified ? 'default' : 'destructive'}>
                              {tutor.verified ? 'Verified' : 'Pending Verification'}
                            </Badge>
                            {tutor.assignedClass && (
                              <Badge variant="secondary" className="bg-red-100 text-red-700">
                                {tutor.assignedClass} (Level {tutor.assignedLevel})
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {tutor.verified && (
                            <AssignClassButton member={tutor} onAssigned={loadData} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Class Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Class Structure</CardTitle>
                <CardDescription>UTM Mandarin Club class levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {[
                    { code: 'HYB01', level: 1, name: 'Beginner' },
                    { code: 'HYB02', level: 2, name: 'Elementary' },
                    { code: 'HYB03', level: 3, name: 'Intermediate' },
                    { code: 'HYB04', level: 4, name: 'Upper Intermediate' },
                    { code: 'HYB05', level: 5, name: 'Advanced' }
                  ].map((cls) => {
                    const assignedTutor = tutors.find(t => t.assignedClass === cls.code);
                    return (
                      <div key={cls.code} className="p-4 border rounded-lg bg-white">
                        <p className="font-mono font-bold text-red-600">{cls.code}</p>
                        <p className="text-sm text-gray-600 mt-1">Level {cls.level}</p>
                        <p className="text-xs text-gray-500">{cls.name}</p>
                        {assignedTutor && (
                          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {assignedTutor.name}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update event details' : 'Add a new event to the calendar'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Event title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Event description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={eventVenue}
                onChange={(e) => setEventVenue(e.target.value)}
                placeholder="Event venue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Special Event</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEvent}>
                {editingEvent ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Generator Dialog */}
      {showQRCode && selectedEvent && (
        <QRCodeGenerator
          event={selectedEvent}
          onClose={() => {
            setShowQRCode(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}