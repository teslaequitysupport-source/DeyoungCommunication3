import { NextResponse } from "next/server";

/**
 * GET /api/booking/ics
 * Generates a real RFC 5545 calendar event (.ics) for a demo appointment
 * booked by an AI employee: the same file format a production booking
 * would attach. Works in Google Calendar, Apple Calendar, Outlook.
 */

function icsDate(d: Date): string {
  // ICS timestamps are UTC, formatted YYYYMMDDTHHMMSSZ.
  return (
    d.getUTCFullYear() +
    String(d.getUTCMonth() + 1).padStart(2, "0") +
    String(d.getUTCDate()).padStart(2, "0") +
    "T" +
    String(d.getUTCHours()).padStart(2, "0") +
    String(d.getUTCMinutes()).padStart(2, "0") +
    "00Z"
  );
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET() {
  // Next weekday at 09:30 local-equivalent (UTC base, 30 minutes).
  const start = new Date();
  const day = start.getUTCDay(); // 0 Sun .. 6 Sat
  let addDays = 1;
  if (day === 5) addDays = 3; // Friday -> Monday
  else if (day === 6) addDays = 2; // Saturday -> Monday
  start.setUTCDate(start.getUTCDate() + addDays);
  start.setUTCHours(9, 30, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const stamp = new Date();

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DEYOUNG COMMUNICATION//AI Employees//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@deyoungcommunication.com`,
    `DTSTAMP:${icsDate(stamp)}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    "SUMMARY:" + escapeText("Appointment held by your AI employee"),
    "DESCRIPTION:" + escapeText(
      "Demo booking generated live by DEYOUNG COMMUNICATION. In production this event is created the moment your AI scheduler books a slot on a call.",
    ),
    "LOCATION:" + escapeText("Your business"),
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT60M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="deyoung-appointment.ics"',
      "Cache-Control": "no-store",
    },
  });
}
