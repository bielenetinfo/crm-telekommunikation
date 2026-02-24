import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function VvlActions({ contract, onStartVvl, onCompleteVvl }) {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");

  const canStartVvl = contract.status === 'aktiv' && ['offen', 'geplant'].includes(contract.vvl_status);
  const isVvlRunning = ['in_bearbeitung', 'kunde_kontaktiert', 'angebot_erstellt'].includes(contract.vvl_status);

  const handleComplete = () => {
    if (outcome) {
      onCompleteVvl(outcome, notes);
      setShowCompleteDialog(false);
      setOutcome("");
      setNotes("");
    }
  };

  return (
    <>
      {canStartVvl && (
        <Button
          onClick={onStartVvl}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          VVL starten
        </Button>
      )}

      {isVvlRunning && (
        <Button
          onClick={() => setShowCompleteDialog(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          VVL abschließen
        </Button>
      )}

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="bg-[#181B21] border-[#2D3139] text-[#EAECEF]">
          <DialogHeader>
            <DialogTitle>VVL abschließen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ergebnis</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={outcome === 'verlängert' ? 'default' : 'outline'}
                  onClick={() => setOutcome('verlängert')}
                  className={outcome === 'verlängert' ? 'bg-emerald-500' : ''}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verlängert
                </Button>
                <Button
                  variant={outcome === 'gekündigt' ? 'default' : 'outline'}
                  onClick={() => setOutcome('gekündigt')}
                  className={outcome === 'gekündigt' ? 'bg-rose-500' : ''}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Gekündigt
                </Button>
              </div>
            </div>
            <div>
              <Label>Notizen (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 bg-[#1F2228] border-[#2D3139]"
                rows={3}
              />
            </div>
            <Button
              onClick={handleComplete}
              disabled={!outcome}
              className="w-full bg-[#FFD24D] text-[#0F1115] hover:bg-[#E6BC3A]"
            >
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}