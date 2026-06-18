import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  LogOut,
  CreditCard,
  CalendarCheck,
  GraduationCap,
} from "lucide-react";
import { api } from "../lib/api";
import { CheckInDialog } from "./CheckInDialog";
import { EventsCalendar } from "./EventsCalendar";
import { FloatingChatbot } from "./FloatingChatbot";
import { MembershipCard } from "./MembershipCard";
import { AssessmentsView } from "./AssessmentsView";
import { AdvertisementSlideshow } from "./AdvertisementSlideshow";
import { PaymentDialog } from "./PaymentDialog";
import { PaymentHistory } from "./PaymentHistory";
import { PaymentButton } from "./PaymentButton";
import clubLogo from "figma:asset/ade13b6fb51eb9b3ff7200cf4269cebe703dd1ea.png";

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
}

export function StudentDashboard({
  user,
  onLogout,
}: StudentDashboardProps) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "attendance"
    | "events"
    | "membership"
    | "assessments"
  >("overview");

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        attendanceData,
        eventsData,
        rsvpData,
        profileData,
        assessmentsData,
        submissionsData,
        certificatesData,
      ] = await Promise.all([
        api.getAttendance(user.id).catch((err) => {
          console.error("Attendance error:", err);
          return { attendance: [] };
        }),
        api.getEvents().catch((err) => {
          console.error("Events error:", err);
          return { events: [] };
        }),
        api.getUserRsvps(user.id).catch((err) => {
          console.error("RSVPs error:", err);
          return { rsvps: [] };
        }),
        api.getProfile(user.id).catch((err) => {
          console.error("Profile error:", err);
          return { profile: null };
        }),
        api.getAssessments().catch((err) => {
          console.error("Assessments error:", err);
          return { assessments: [] };
        }),
        api.getSubmissions(user.id).catch((err) => {
          console.error("Submissions error:", err);
          return { submissions: [] };
        }),
        api.getCertificates(user.id).catch((err) => {
          console.error("Certificates error:", err);
          return { certificates: [] };
        }),
      ]);

      setAttendance(attendanceData.attendance || []);
      setEvents(eventsData.events || []);
      setRsvps(rsvpData.rsvps || []);
      
      // Get profile with proper fallback and localStorage sync
      const userProfile = profileData.profile || {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || "Student",
        role: "student",
        level: parseInt(localStorage.getItem(`user_membership_level_${user.id}`) || "1"),
        membershipLevel: parseInt(localStorage.getItem(`user_membership_level_${user.id}`) || "1"),
        membershipActive: false,
        membershipExpiry: localStorage.getItem(`user_membership_expiry_${user.id}`) || new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // Expired 1 month ago if no expiry found
      };
      
      console.log('StudentDashboard - User profile loaded:', userProfile);
      console.log('StudentDashboard - Membership expiry:', userProfile.membershipExpiry);
      console.log('StudentDashboard - Is expired?', new Date(userProfile.membershipExpiry) < new Date());
      
      setProfile(userProfile);
      setAssessments(assessmentsData.assessments || []);
      setSubmissions(submissionsData.submissions || []);
      setCertificates(certificatesData.certificates || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = events
    .filter((event) => new Date(event.date) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    .slice(0, 3);

  const attendanceRate =
    events.length > 0
      ? Math.round((attendance.length / events.length) * 100)
      : 0;

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
              <img
                src={clubLogo}
                alt="UTM Mandarin Club"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl">UTM Mandarin Club</h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">
                    Welcome, {user.user_metadata?.name}!
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                  >
                    Level {profile?.level || 1}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PaymentButton
                profile={profile}
                onClick={() => setShowPayment(true)}
                variant="compact"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Horizontally scrollable */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 min-w-max">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("attendance")}
                className={`py-4 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "attendance"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setActiveTab("events")}
                className={`py-4 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "events"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Events
              </button>
              <button
                onClick={() => setActiveTab("membership")}
                className={`py-4 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "membership"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Membership
              </button>
              <button
                onClick={() => setActiveTab("assessments")}
                className={`py-4 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "assessments"
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Assessments
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Advertisement Slideshow */}
            <AdvertisementSlideshow />

            {/* Quick Info Grid - 2 Items per Row */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Row 1 */}
                {/* Membership Status */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      profile &&
                      new Date(profile.membershipExpiry) >
                        new Date()
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">
                      Membership
                    </p>
                    <p className="font-medium">
                      {profile &&
                      new Date(profile.membershipExpiry) >
                        new Date()
                        ? "Active"
                        : "Expired"}{" "}
                      • Level {profile?.level || 1}
                    </p>
                  </div>
                </div>

                {/* Upcoming RSVPs */}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setActiveTab("events")}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">
                      Upcoming RSVPs
                    </p>
                    <p className="font-medium">
                      {rsvps.length} Events
                    </p>
                  </div>
                </div>

                {/* Assessments - Total Score */}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setActiveTab("assessments")}
                >
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">
                      Total Score
                    </p>
                    <p className="font-medium">
                      {submissions.reduce(
                        (sum, sub) => sum + (sub.score || 0),
                        0,
                      )}{" "}
                      Points
                    </p>
                  </div>
                </div>

                {/* Quick Check-In */}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-50 to-red-100 border border-red-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setShowCheckIn(true)}
                >
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">
                      Quick Check-In
                    </p>
                    <p className="font-medium">
                      Scan QR / Code
                    </p>
                  </div>
                </div>

                {/* Attendance Rate */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {attendanceRate}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">
                      Attendance Rate
                    </p>
                    <p className="font-medium">
                      {attendance.length} / {events.length}{" "}
                      Events
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Membership Payment Card */}
            <PaymentButton
              profile={profile}
              onClick={() => setShowPayment(true)}
              variant="card"
            />
          </div>
        )}

        {activeTab === "attendance" && (
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>
                Your complete attendance record
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No attendance records yet
                  </p>
                  <Button onClick={() => setShowCheckIn(true)}>
                    <QrCode className="w-4 h-4 mr-2" />
                    Check-In Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {attendance
                    .sort(
                      (a, b) =>
                        new Date(b.checkedInAt).getTime() -
                        new Date(a.checkedInAt).getTime(),
                    )
                    .map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">
                            {record.eventTitle}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {new Date(
                              record.checkedInAt,
                            ).toLocaleString()}
                          </p>
                        </div>
                        <Badge>Attended</Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "events" && (
          <EventsCalendar
            events={events}
            rsvps={rsvps}
            onRsvp={async (eventId) => {
              await api.rsvpEvent(eventId);
              loadData();
            }}
            onCancelRsvp={async (eventId) => {
              await api.cancelRsvp(eventId);
              loadData();
            }}
          />
        )}

        {activeTab === "membership" && profile && (
          <div className="space-y-6">
            <MembershipCard
              profile={profile}
              certificates={certificates}
              onPaymentClick={() => setShowPayment(true)}
            />
            <PaymentHistory userId={user.id} />
          </div>
        )}

        {activeTab === "assessments" && profile && (
          <AssessmentsView
            assessments={assessments}
            submissions={submissions}
            userLevel={profile.level}
            onAssessmentComplete={loadData}
          />
        )}
      </main>

      {/* Dialogs */}
      {showCheckIn && (
        <CheckInDialog
          onClose={() => setShowCheckIn(false)}
          onCheckIn={async (code) => {
            await api.checkIn(code);
            loadData();
            setShowCheckIn(false);
          }}
        />
      )}

      {showPayment && profile && (
        <PaymentDialog
          open={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            loadData();
            setShowPayment(false);
          }}
          profile={profile}
        />
      )}

      {/* Floating Chatbot */}
      <FloatingChatbot />
    </div>
  );
}