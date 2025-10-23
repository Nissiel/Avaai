"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Circle, CheckCircle, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { PhoneNumber } from "@/components/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChecklistAndConfig({
  ready,
  setReady,
  selectedPhoneNumber,
  setSelectedPhoneNumber,
}: {
  ready: boolean;
  setReady: (val: boolean) => void;
  selectedPhoneNumber: string;
  setSelectedPhoneNumber: (val: string) => void;
}) {
  const [hasCredentials, setHasCredentials] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [currentNumberSid, setCurrentNumberSid] = useState("");
  const [currentVoiceUrl, setCurrentVoiceUrl] = useState("");

  const [publicUrl, setPublicUrl] = useState("");
  const [localServerUp, setLocalServerUp] = useState(false);
  const [publicUrlAccessible, setPublicUrlAccessible] = useState(false);

  const [allChecksPassed, setAllChecksPassed] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [ngrokLoading, setNgrokLoading] = useState(false);

  const appendedTwimlUrl = publicUrl ? `${publicUrl}/twiml` : "";
  const isWebhookMismatch =
    appendedTwimlUrl && currentVoiceUrl && appendedTwimlUrl !== currentVoiceUrl;

  useEffect(() => {
    let polling = true;

    const pollChecks = async () => {
      try {
        // 1. Check credentials
        let res = await fetch("/api/twilio");
        if (!res.ok) throw new Error("Failed credentials check");
        const credData = await res.json();
        setHasCredentials(!!credData?.credentialsSet);

        // 2. Fetch numbers
        res = await fetch("/api/twilio/numbers");
        if (!res.ok) throw new Error("Failed to fetch phone numbers");
        const numbersData = await res.json();
        if (Array.isArray(numbersData) && numbersData.length > 0) {
          setPhoneNumbers(numbersData);
          // If currentNumberSid not set or not in the list, use first
          const selected =
            numbersData.find((p: PhoneNumber) => p.sid === currentNumberSid) ||
            numbersData[0];
          setCurrentNumberSid(selected.sid);
          setCurrentVoiceUrl(selected.voiceUrl || "");
          setSelectedPhoneNumber(selected.friendlyName || "");
        }

        // 3. Check local server & public URL
        let foundPublicUrl = "";
        try {
          const resLocal = await fetch("http://localhost:8081/public-url");
          if (resLocal.ok) {
            const pubData = await resLocal.json();
            foundPublicUrl = pubData?.publicUrl || "";
            setLocalServerUp(true);
            setPublicUrl(foundPublicUrl);
          } else {
            throw new Error("Local server not responding");
          }
        } catch {
          setLocalServerUp(false);
          setPublicUrl("");
        }
      } catch (err) {
        console.error(err);
      }
    };

    pollChecks();
    const intervalId = setInterval(() => polling && pollChecks(), 1000);
    return () => {
      polling = false;
      clearInterval(intervalId);
    };
  }, [currentNumberSid, setSelectedPhoneNumber]);

  const updateWebhook = async () => {
    if (!currentNumberSid || !appendedTwimlUrl) {
      console.log("updateWebhook: missing requirements", { currentNumberSid, appendedTwimlUrl });
      return;
    }
    try {
      setWebhookLoading(true);
      console.log("Updating webhook for number:", currentNumberSid, "with URL:", appendedTwimlUrl);
      
      const res = await fetch("/api/twilio/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberSid: currentNumberSid,
          voiceUrl: appendedTwimlUrl,
        }),
      });
      
      console.log("Webhook update response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Webhook update failed:", errorText);
        throw new Error(`Failed to update webhook: ${res.status} - ${errorText}`);
      }
      
      const updatedNumber = await res.json();
      console.log("Webhook updated successfully:", updatedNumber);
      setCurrentVoiceUrl(appendedTwimlUrl);
    } catch (err) {
      console.error("Webhook update error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`Failed to update webhook: ${errorMessage}`);
    } finally {
      setWebhookLoading(false);
    }
  };

  const checkNgrok = async () => {
    if (!localServerUp || !publicUrl) {
      console.log("checkNgrok: localServerUp:", localServerUp, "publicUrl:", publicUrl);
      return;
    }
    setNgrokLoading(true);
    let success = false;
    console.log("Checking ngrok URL:", publicUrl + "/public-url");
    
    for (let i = 0; i < 3; i++) {
      try {
        const testUrl = publicUrl + "/public-url";
        console.log(`Attempt ${i + 1}: Testing ${testUrl}`);
        const resTest = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': 'true' // Skip ngrok browser warning
          }
        });
        console.log(`Response status: ${resTest.status}`);
        if (resTest.ok) {
          const data = await resTest.json();
          console.log("Response data:", data);
          setPublicUrlAccessible(true);
          success = true;
          break;
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
      }
      if (i < 2) {
        console.log("Waiting 2 seconds before retry...");
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    if (!success) {
      console.log("All ngrok check attempts failed");
      setPublicUrlAccessible(false);
    } else {
      console.log("Ngrok check successful!");
    }
    setNgrokLoading(false);
  };

  const checklist = useMemo(() => {
    return [
      {
        label: "Set up Twilio account",
        done: hasCredentials,
        description: "Then update account details in webapp/.env",
        field: (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-transparent py-2 font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-60 bg-brand-500 text-white shadow-elevated hover:bg-brand-600 hover:shadow-lg active:scale-[0.995] h-10 px-4 text-sm w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔧 Open Twilio Console clicked!');
              alert('Twilio Console button clicked!'); // Test visible
              window.open("https://console.twilio.com/", "_blank");
            }}
          >
            Open Twilio Console
          </button>
        ),
      },
      {
        label: "Set up Twilio phone number",
        done: phoneNumbers.length > 0,
        description: "Costs around $1.15/month",
        field:
          phoneNumbers.length > 0 ? (
            phoneNumbers.length === 1 ? (
              <Input value={phoneNumbers[0].friendlyName || ""} disabled />
            ) : (
              <Select
                onValueChange={(value) => {
                  setCurrentNumberSid(value);
                  const selected = phoneNumbers.find((p) => p.sid === value);
                  if (selected) {
                    setSelectedPhoneNumber(selected.friendlyName || "");
                    setCurrentVoiceUrl(selected.voiceUrl || "");
                  }
                }}
                value={currentNumberSid}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a phone number" />
                </SelectTrigger>
                <SelectContent>
                  {phoneNumbers.map((phone) => (
                    <SelectItem key={phone.sid} value={phone.sid}>
                      {phone.friendlyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          ) : (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-transparent py-2 font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-60 bg-brand-500 text-white shadow-elevated hover:bg-brand-600 hover:shadow-lg active:scale-[0.995] h-10 px-4 text-sm w-full"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔧 Set up Twilio phone number clicked!');
                alert('Set up Twilio phone number clicked!'); // Test visible
                window.open(
                  "https://console.twilio.com/us1/develop/phone-numbers/manage/incoming",
                  "_blank"
                );
              }}
            >
              Set up Twilio phone number
            </button>
          ),
      },
      {
        label: "Start local WebSocket server",
        done: localServerUp,
        description: "cd websocket-server && npm run dev",
        field: null,
      },
      {
        label: "Start ngrok",
        done: publicUrlAccessible,
        description: "Then set ngrok URL in websocket-server/.env",
        field: (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1">
              <Input value={publicUrl} disabled />
            </div>
            <div className="flex-1">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-border py-2 font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-60 bg-background hover:bg-accent/60 hover:text-foreground h-10 px-4 text-sm w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔧 Check ngrok clicked!', { ngrokLoading, localServerUp, publicUrl });
                  alert('Check ngrok button clicked!');
                  checkNgrok();
                }}
                disabled={ngrokLoading || !localServerUp || !publicUrl}
                style={{ opacity: (ngrokLoading || !localServerUp || !publicUrl) ? 0.6 : 1 }}
              >
                {ngrokLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check ngrok"
                )}
              </button>
            </div>
          </div>
        ),
      },
      {
        label: "Update Twilio webhook URL",
        done: !!publicUrl && !isWebhookMismatch,
        description: "Can also be done manually in Twilio console",
        field: (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1">
              <Input value={currentVoiceUrl} disabled className="w-full" />
            </div>
            <div className="flex-1">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-transparent py-2 font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-60 bg-brand-500 text-white shadow-elevated hover:bg-brand-600 hover:shadow-lg active:scale-[0.995] h-10 px-4 text-sm w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔧 Update Webhook clicked!', { webhookLoading, currentNumberSid, appendedTwimlUrl });
                  alert('Update Webhook button clicked!');
                  updateWebhook();
                }}
                disabled={webhookLoading}
                style={{ opacity: webhookLoading ? 0.6 : 1 }}
              >
                {webhookLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Webhook"
                )}
              </button>
            </div>
          </div>
        ),
      },
    ];
  }, [
    hasCredentials,
    phoneNumbers,
    currentNumberSid,
    localServerUp,
    publicUrl,
    publicUrlAccessible,
    currentVoiceUrl,
    isWebhookMismatch,
    appendedTwimlUrl,
    webhookLoading,
    ngrokLoading,
    setSelectedPhoneNumber,
  ]);

  useEffect(() => {
    setAllChecksPassed(checklist.every((item) => item.done));
  }, [checklist]);

  useEffect(() => {
    if (!ready) {
      checkNgrok();
    }
  }, [localServerUp, ready]);

  useEffect(() => {
    if (!allChecksPassed) {
      setReady(false);
    }
  }, [allChecksPassed, setReady]);

  const handleDone = () => {
    console.log("Setup completed! All checks passed:", allChecksPassed);
    setReady(true);
  };

  const refreshChecks = async () => {
    console.log("Refreshing all checks...");
    // Force re-check of all systems
    if (localServerUp && publicUrl) {
      await checkNgrok();
    }
  };

  // Debug logs
  console.log('🔧 ChecklistAndConfig render:', { 
    ready, 
    allChecksPassed, 
    localServerUp, 
    publicUrl, 
    hasCredentials,
    phoneNumbers: phoneNumbers.length 
  });

  return (
    <Dialog open={!ready} onOpenChange={(open) => {
      console.log('🔧 Dialog onOpenChange:', open);
      alert('Dialog close attempted!');
      if (!open) {
        setReady(true);
      }
    }}>
      <DialogContent className="w-full max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Setup Checklist</DialogTitle>
          <DialogDescription>
            This sample app requires a few steps before you get started
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-0">
          {checklist.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 py-2"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  {item.done ? (
                    <CheckCircle className="text-green-500" />
                  ) : (
                    <Circle className="text-gray-400" />
                  )}
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 ml-8">
                    {item.description}
                  </p>
                )}
              </div>
              <div 
                className="flex items-center mt-2 sm:mt-0" 
                style={{ position: 'relative', zIndex: 5 }}
              >
                {item.field}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-between" style={{ position: 'relative', zIndex: 10 }}>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-transparent py-2 font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-60 bg-transparent hover:bg-accent/60 text-foreground h-10 px-4 text-sm flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔧 Refresh Checks clicked!');
              alert('Refresh button works!');
              refreshChecks();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Checks
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-border py-2 font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-60 bg-background hover:bg-accent/60 hover:text-foreground h-10 px-4 text-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔧 Let\'s go! clicked!', { allChecksPassed });
              alert('Lets go button works!');
              if (allChecksPassed) {
                setReady(true);
              } else {
                alert("Please complete all checklist items first");
              }
            }}
            disabled={!allChecksPassed}
            style={{ opacity: allChecksPassed ? 1 : 0.6 }}
          >
            Let's go! {allChecksPassed ? '✅' : '⏳'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
