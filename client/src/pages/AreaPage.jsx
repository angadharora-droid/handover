import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Check } from 'lucide-react';
import { useChecklist, useEntries, useHandover, useCustomItems } from '../lib/queries';
import { buildEntryMap, buildCustomMap, customItemsFor, getAreaProgress } from '../lib/checklist';
import { canEditArea } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import { pctClasses } from '../lib/statusStyles';
import { AreaIcon } from '../components/areaIcons';
import ChecklistTable from '../components/ChecklistTable';
import RoomGrid from '../components/RoomGrid';
import { LoadingScreen } from '../components/ui';
import { ErrorBox } from './Home';

export default function AreaPage() {
  const { areaName } = useParams();
  const area = decodeURIComponent(areaName);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: cl, isLoading: l1, error: e1 } = useChecklist();
  const { data: entries, isLoading: l2, error: e2 } = useEntries();
  const { data: customItems } = useCustomItems();
  const { data: handover } = useHandover();

  const checklist = cl?.checklist;
  const def = checklist?.[area];
  const isRooms = !!def?.isRooms;

  const [room, setRoom] = useState(null);
  useEffect(() => {
    if (isRooms && !room && def?.floors?.length) setRoom(def.floors[0].num);
  }, [isRooms, room, def]);

  if (l1 || l2) return <LoadingScreen />;
  if (e1 || e2) return <ErrorBox error={e1 || e2} />;
  if (!def) return <ErrorBox error={{ message: `Unknown area: ${area}` }} />;

  const map = buildEntryMap(entries);
  const customMap = buildCustomMap(customItems);
  const finalised = !!handover?.finalised;
  const editable = canEditArea(user, area);
  const readOnly = finalised || !editable;
  const isAdmin = user?.role === 'admin';
  const isViewer = user?.role === 'viewer';
  const roomCat = isRooms ? def.floors.find((f) => f.num === room)?.cat : null;
  const progress = getAreaProgress(checklist, area, map, customMap);

  return (
    <div>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition hover:text-maroon"
      >
        <ArrowLeft className="h-4 w-4" /> All Areas
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-maroon-light text-maroon ring-1 ring-inset ring-maroon/10">
            <AreaIcon area={area} className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{area}</h1>
            <p className="text-xs text-stone-500">Centre Point Amravati · Handover Checklist</p>
          </div>
        </div>
        <span className={`badge px-3 py-1 text-xs ${pctClasses(progress.pct)}`}>
          {progress.pct}% · {progress.done}/{progress.total} complete
        </span>
      </div>

      {!editable && !finalised && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong className="font-semibold">Read-only.</strong>{' '}
            {isViewer
              ? 'Your account has view-only access — you can browse every section but cannot make changes.'
              : 'You are not assigned to this section. Ask an administrator to assign you to update items here.'}
          </span>
        </div>
      )}

      <div className="card p-4 sm:p-6">
        {isRooms && (
          <div className="mb-6">
            <RoomGrid
              checklist={checklist}
              area={area}
              selected={room}
              onSelect={setRoom}
              entriesMap={map}
              customMap={customMap}
            />
          </div>
        )}

        {isRooms && room && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-maroon-light px-3 py-1.5 text-sm font-semibold text-maroon">
            Room {room}
            <span className="font-normal text-maroon/60">· {roomCat}</span>
          </div>
        )}

        {(!isRooms || room) && (
          <ChecklistTable
            key={`${area}::${room || '-'}`}
            checklist={checklist}
            area={area}
            room={room}
            entriesMap={map}
            statusOptions={cl.statusOptions}
            disabled={readOnly}
            isAdmin={isAdmin}
            customItems={customItemsFor(customMap, area, room)}
          />
        )}

        {isRooms && !room && (
          <div className="py-6 text-sm text-stone-500">Select a room above to view its checklist.</div>
        )}

        <div className="mt-6 flex justify-end border-t border-stone-200 pt-5">
          <button onClick={() => navigate('/')} className="btn btn-primary">
            <Check className="h-4 w-4" /> {readOnly ? 'Back to Areas' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
