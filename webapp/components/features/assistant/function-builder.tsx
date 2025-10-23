'use client';

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Settings, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";

import type { AssistantFunctionDefinition } from "@/lib/dto";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturisticButton } from "@/components/ui/futuristic-button";
import { Badge } from "@/components/ui/badge";

type CatalogFunction = {
  id: string;
  label: string;
  category: string;
  description: string;
  definition: AssistantFunctionDefinition;
};

type ActiveFunction = AssistantFunctionDefinition & {
  _id: string;
  category?: string;
  label?: string;
};

const AVAILABLE_FUNCTIONS: CatalogFunction[] = [
  {
    id: "send_email",
    label: "Envoyer email",
    description: "Envoyer un email via votre fournisseur connecté",
    category: "Communication",
    definition: {
      name: "send_email",
      description: "Envoie un email personnalisé à un destinataire donné.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Adresse email du destinataire" },
          subject: { type: "string", description: "Objet du message" },
          body: { type: "string", description: "Contenu du mail (Markdown autorisé)" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    id: "create_event",
    label: "Créer un événement",
    description: "Planifier un créneau dans le calendrier de l'équipe",
    category: "Calendrier",
    definition: {
      name: "create_calendar_event",
      description: "Crée un événement dans le calendrier associé au compte.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titre de l'événement" },
          date: { type: "string", description: "Date ISO (YYYY-MM-DD)" },
          time: { type: "string", description: "Heure (HH:mm)" },
          durationMinutes: { type: "number", description: "Durée en minutes" },
          attendees: {
            type: "array",
            items: { type: "string" },
            description: "Liste d'emails invités",
          },
          location: { type: "string", description: "Lieu ou lien de visioconférence" },
        },
        required: ["title", "date", "time"],
      },
    },
  },
  {
    id: "log_crm",
    label: "Logger CRM",
    description: "Enregistrer un compte-rendu dans le CRM",
    category: "CRM",
    definition: {
      name: "log_crm_activity",
      description: "Crée une note dans le CRM connecté avec résumé et statut.",
      parameters: {
        type: "object",
        properties: {
          contactId: { type: "string", description: "Identifiant du contact CRM" },
          summary: { type: "string", description: "Résumé de l'appel" },
          status: { type: "string", description: "Statut suivant l'appel" },
          followUpDate: { type: "string", description: "Date de suivi (optionnel)" },
        },
        required: ["contactId", "summary"],
      },
    },
  },
  {
    id: "send_sms",
    label: "Envoyer SMS",
    description: "Envoyer un SMS de confirmation ou de rappel",
    category: "Communication",
    definition: {
      name: "send_sms",
      description: "Envoie un SMS au numéro fourni avec un message personnalisé.",
      parameters: {
        type: "object",
        properties: {
          phoneNumber: { type: "string", description: "Numéro de téléphone au format international" },
          message: { type: "string", description: "Message texte (160 caractères max recomendado)" },
        },
        required: ["phoneNumber", "message"],
      },
    },
  },
  {
    id: "create_ticket",
    label: "Créer ticket support",
    description: "Ouvrir un ticket dans le helpdesk",
    category: "Support",
    definition: {
      name: "create_support_ticket",
      description: "Crée un ticket dans l'outil de support pour suivi ultérieur.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titre ou sujet du ticket" },
          description: { type: "string", description: "Description détaillée du problème" },
          priority: { type: "string", description: "Priorité (low, medium, high)" },
        },
        required: ["title", "description"],
      },
    },
  },
  {
    id: "transfer_call",
    label: "Transférer appel",
    description: "Transférer l'appel vers un agent humain",
    category: "Téléphonie",
    definition: {
      name: "transfer_call",
      description: "Transfère l'appel courant vers un agent humain déterminé.",
      parameters: {
        type: "object",
        properties: {
          target: { type: "string", description: "Identifiant ou numéro de l'agent" },
          note: { type: "string", description: "Contexte pour l'agent humain" },
        },
        required: ["target"],
      },
    },
  },
];

function enhanceFunction(definition: AssistantFunctionDefinition, meta?: { category?: string; label?: string }): ActiveFunction {
  return {
    ...definition,
    category: meta?.category,
    label: meta?.label ?? definition.name,
    _id: `${definition.name}-${nanoid(6)}`,
  };
}

function SortableFunction({ func, onRemove }: { func: ActiveFunction; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: func._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 rounded-xl bg-muted/20 p-4">
      <button {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="flex-1">
        <h4 className="font-medium">{func.label ?? func.name}</h4>
        <p className="text-sm text-muted-foreground">{func.description}</p>
      </div>

      {func.category ? <Badge variant="outline">{func.category}</Badge> : null}

      <div className="flex gap-2">
        <button className="rounded-lg p-2 transition-colors hover:bg-muted/40">
          <Settings className="h-4 w-4" />
        </button>
        <button onClick={onRemove} className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/20">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface FunctionBuilderProps {
  value?: AssistantFunctionDefinition[];
  onChange?: (functions: AssistantFunctionDefinition[]) => void;
  readOnly?: boolean;
}

function normalizeInitialValue(value?: AssistantFunctionDefinition[]): ActiveFunction[] {
  if (!value) return [];
  return value.map((func) => ({
    ...func,
    _id: `${func.name}-${nanoid(6)}`,
  }));
}

export function FunctionBuilder({ value, onChange, readOnly }: FunctionBuilderProps) {
  const [activeFunctions, setActiveFunctions] = useState<ActiveFunction[]>(() => normalizeInitialValue(value));

  useEffect(() => {
    setActiveFunctions(normalizeInitialValue(value));
  }, [value]);

  useEffect(() => {
    if (onChange) {
      const payload = activeFunctions.map(({ _id, category, label, ...rest }) => rest);
      onChange(payload);
    }
  }, [activeFunctions, onChange]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setActiveFunctions((items) => {
      const oldIndex = items.findIndex((item) => item._id === active.id);
      const newIndex = items.findIndex((item) => item._id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function addFunction(func: CatalogFunction) {
    if (readOnly) return;
    setActiveFunctions((items) => {
      const exists = items.some((item) => item.name === func.definition.name);
      if (exists) return items;
      return [
        ...items,
        {
          ...func.definition,
          category: func.category,
          label: func.label,
          _id: `${func.definition.name}-${nanoid(6)}`,
        },
      ];
    });
  }

  function removeFunction(id: string) {
    if (readOnly) return;
    setActiveFunctions((items) => items.filter((item) => item._id !== id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4">
        <h3 className="font-semibold">Bibliothèque de fonctions</h3>
        <div className="space-y-2">
          {AVAILABLE_FUNCTIONS.map((func) => (
            <div
              key={func.id}
              onClick={() => addFunction(func)}
              className={`rounded-xl border border-transparent bg-muted/20 p-3 transition-colors ${
                readOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/50 hover:bg-primary/10"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{func.label}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{func.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {func.category}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Fonctions actives ({activeFunctions.length})</h3>
          <FuturisticButton
            size="sm"
            variant="ghost"
            onClick={() => !readOnly && setActiveFunctions([])}
            disabled={readOnly}
          >
            Tout supprimer
          </FuturisticButton>
        </div>

        {activeFunctions.length === 0 ? (
          <GlassCard variant="none" className="flex h-[300px] items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Aucune fonction active</p>
              <p className="mt-1 text-sm text-muted-foreground">Cliquez sur une fonction pour l'ajouter</p>
            </div>
          </GlassCard>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeFunctions.map((item) => item._id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {activeFunctions.map((func) => (
                  <SortableFunction key={func._id} func={func} onRemove={() => removeFunction(func._id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
