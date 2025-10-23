export type MockTwilioNumber = {
  sid: string;
  phoneNumber: string;
  capabilities: string[];
};

const numbers: MockTwilioNumber[] = [
  {
    sid: "PN0001",
    phoneNumber: "+16285550195",
    capabilities: ["voice", "sms"],
  },
  {
    sid: "PN0002",
    phoneNumber: "+33186954520",
    capabilities: ["voice"],
  },
];

export async function listNumbers(): Promise<MockTwilioNumber[]> {
  return numbers;
}

export async function purchaseNumber(countryCode: string) {
  return {
    sid: `PN${Date.now()}`,
    phoneNumber: countryCode === "FR" ? "+33186954521" : "+16285550196",
  };
}

export async function startWebRtcCheck() {
  return {
    status: "ok",
    latency: 42,
    packetLoss: 0.01,
  };
}
