import type { CallSummary } from "@/lib/dto";

export type ContactSortOption = "recent" | "frequent" | "oldest";

export interface ContactAggregate {
  id: string;
  phone: string;
  callCount: number;
  calls: CallSummary[];
  recentCalls: CallSummary[];
  lastCall?: CallSummary;
  firstCall?: CallSummary;
  lastCallDate?: Date;
  firstCallDate?: Date;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
}

const UNKNOWN_CONTACT_ID = "unknown";

function normalisePhone(phone?: string | null): string {
  if (!phone) return UNKNOWN_CONTACT_ID;
  const trimmed = phone.trim();
  return trimmed.length > 0 ? trimmed : UNKNOWN_CONTACT_ID;
}

function safeDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function buildContactAggregates(calls: CallSummary[]): ContactAggregate[] {
  const aggregates = new Map<string, ContactAggregate>();

  for (const call of calls) {
    const contactId = normalisePhone(call.customerNumber);
    let aggregate = aggregates.get(contactId);

    if (!aggregate) {
      aggregate = {
        id: contactId,
        phone: contactId,
        callCount: 0,
        calls: [],
        recentCalls: [],
        totalDurationSeconds: 0,
        averageDurationSeconds: 0,
      };
      aggregates.set(contactId, aggregate);
    }

    aggregate.calls.push(call);
    aggregate.callCount += 1;
    aggregate.totalDurationSeconds += call.durationSeconds ?? 0;
  }

  return Array.from(aggregates.values()).map((aggregate) => {
    const sortedCalls = [...aggregate.calls].sort((a, b) => {
      const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bTime - aTime;
    });

    const lastCall = sortedCalls[0];
    const firstCall = sortedCalls[sortedCalls.length - 1];

    return {
      ...aggregate,
      calls: sortedCalls,
      recentCalls: sortedCalls.slice(0, 5),
      lastCall,
      firstCall,
      lastCallDate: safeDate(lastCall?.startedAt),
      firstCallDate: safeDate(firstCall?.startedAt),
      averageDurationSeconds:
        aggregate.callCount > 0 ? aggregate.totalDurationSeconds / aggregate.callCount : 0,
    };
  });
}

export function sortContactAggregates(
  contacts: ContactAggregate[],
  sortBy: ContactSortOption,
): ContactAggregate[] {
  const next = [...contacts];

  next.sort((a, b) => {
    if (sortBy === "recent") {
      return (b.lastCallDate?.getTime() || 0) - (a.lastCallDate?.getTime() || 0);
    }
    if (sortBy === "frequent") {
      return b.callCount - a.callCount;
    }
    if (sortBy === "oldest") {
      return (a.firstCallDate?.getTime() || 0) - (b.firstCallDate?.getTime() || 0);
    }
    return 0;
  });

  return next;
}

export function findContactAggregate(
  contacts: ContactAggregate[],
  contactId: string,
): ContactAggregate | undefined {
  return contacts.find((contact) => contact.id === contactId);
}
