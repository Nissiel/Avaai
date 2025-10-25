import type { CallSummary } from "@/lib/dto";

export interface Contact {
  phone: string;
  callCount: number;
  lastCallDate?: Date;
  firstCallDate?: Date;
  lastCall?: CallSummary;
  recentCalls: CallSummary[];
}

export type SortOption = "recent" | "frequent" | "oldest";

export const groupCallsByContact = (calls: CallSummary[]): Contact[] => {
  const contactsMap = new Map<string, CallSummary[]>();

  calls.forEach((call) => {
    const phone = call.customerNumber || "Inconnu";
    if (!contactsMap.has(phone)) {
      contactsMap.set(phone, []);
    }
    contactsMap.get(phone)!.push(call);
  });

  const contacts: Contact[] = [];
  contactsMap.forEach((callsList, phone) => {
    const sorted = [...callsList].sort((a, b) => {
      const aDate = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bDate = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bDate - aDate;
    });

    const lastCall = sorted[0];
    const firstCall = sorted[sorted.length - 1];

    contacts.push({
      phone,
      callCount: callsList.length,
      lastCallDate: lastCall?.startedAt ? new Date(lastCall.startedAt) : undefined,
      firstCallDate: firstCall?.startedAt ? new Date(firstCall.startedAt) : undefined,
      lastCall: lastCall,
      recentCalls: sorted.slice(0, 3),
    });
  });

  return contacts;
};

export const sortContacts = (contacts: Contact[], sortBy: SortOption): Contact[] => {
  return [...contacts].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return (b.lastCallDate?.getTime() || 0) - (a.lastCallDate?.getTime() || 0);
      case "frequent":
        return b.callCount - a.callCount;
      case "oldest":
        return (a.firstCallDate?.getTime() || 0) - (b.firstCallDate?.getTime() || 0);
      default:
        return 0;
    }
  });
};
