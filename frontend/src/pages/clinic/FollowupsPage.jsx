import { useState, useEffect, useCallback } from 'react';
import { clinicAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import { formatDateTime, formatDate, errorMessage } from '../../utils/helpers';
import { CheckCircleIcon, XCircleIcon, PhoneIcon, ExclamationTriangleIcon, CalendarIcon, UserIcon, BeakerIcon, ClockIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function FollowupsPage() {
  const [followups, setFollowups] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const query = { page, limit: 15 };
      if (filter !== 'all') query.status = filter;
      const r = await clinicAPI.getFollowups(query);
      setFollowups(r.data.followups || []);
      setTotal(r.data.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleMarkContacted = async (followup) => {
    setSelectedFollowup(followup);
    setNotes(followup.followUpNotes || '');
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await clinicAPI.updateFollowup(selectedFollowup._id, {
        followUpContacted: true,
        followUpNotes: notes,
      });
      toast.success('Follow-up marked as contacted');
      setSelectedFollowup(null);
      setNotes('');
      fetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setSelectedFollowup(null);
    setNotes('');
  };

  const getFilterLabel = (f) => {
    switch (f) {
      case 'upcoming': return 'Upcoming';
      case 'overdue': return 'Overdue';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      default: return 'All';
    }
  };

  // Calculate stats
  const stats = {
    total: followups.length,
    upcoming: followups.filter(f => !f.followUpContacted && !f.isOverdue && f.daysUntil > 0).length,
    overdue: followups.filter(f => f.isOverdue).length,
    completed: followups.filter(f => f.followUpContacted).length,
  };

  const getStatusColor = (followup) => {
    if (followup.followUpContacted) return 'bg-green-100 border-green-300 text-green-800';
    if (followup.isOverdue) return 'bg-red-100 border-red-300 text-red-800';
    if (followup.daysUntil === 0) return 'bg-amber-100 border-amber-300 text-amber-800';
    return 'bg-blue-100 border-blue-300 text-blue-800';
  };

  const getStatusLabel = (followup) => {
    if (followup.followUpContacted) return 'Completed';
    if (followup.isOverdue) return 'Overdue';
    if (followup.daysUntil === 0) return 'Today';
    return 'Upcoming';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-ups Management</h1>
          <p className="page-subtitle">Track and manage pet follow-up appointments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card card-body border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Follow-ups</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="card card-body border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Upcoming</p>
              <p className="text-2xl font-bold text-amber-600">{stats.upcoming}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <div className="card card-body border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="card card-body border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'upcoming', 'overdue', 'pending', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
          >
            {getFilterLabel(f)}
          </button>
        ))}
      </div>

      {/* Follow-ups Display */}
      <div className="card">
        {loading ? <LoadingSpinner /> : (
          <>
            {followups.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <PhoneIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No follow-ups found</p>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {followups.map((f) => (
                  <div key={f._id} className={`card card-body border-2 ${getStatusColor(f)} hover:shadow-lg transition-all`}>
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`badge ${f.followUpContacted ? 'badge-green' : f.isOverdue ? 'badge-red' : 'badge-amber'}`}>
                        {getStatusLabel(f)}
                      </span>
                      <span className="text-xs font-mono text-slate-600">{f.clinicBillId || f._id.slice(-8)}</span>
                    </div>

                    {/* Client & Pet Info */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-slate-500" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{f.client?.name}</p>
                          <p className="text-xs text-slate-500">ID: {f.client?.clientId}</p>
                          {f.client?.address && <p className="text-xs text-slate-500 truncate">{f.client.address}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BeakerIcon className="h-4 w-4 text-slate-500" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-700">{f.pet?.name}</p>
                          <p className="text-xs text-slate-500">
                            {f.pet?.species} {f.pet?.breed && `· ${f.pet?.breed}`}
                            {f.pet?.gender && `· ${f.pet?.gender}`}
                          </p>
                          {f.pet?.weight && <p className="text-xs text-slate-500">Weight: {f.pet.weight}kg</p>}
                          {f.pet?.age && <p className="text-xs text-slate-500">Age: {f.pet.age}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Phone Number - Highlighted */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Contact Number</p>
                          <a href={`tel:${f.client?.mobile}`} className="text-lg font-bold text-blue-800 hover:underline">
                            {f.client?.mobile}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Follow-up Date */}
                    <div className="bg-white/50 rounded-lg p-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-slate-600" />
                        <div>
                          <p className="font-medium text-slate-700">{formatDate(f.followUpDate)}</p>
                          <p className="text-xs text-slate-500">
                            {f.isOverdue
                              ? `${Math.abs(f.daysUntil)} days overdue`
                              : f.daysUntil === 0
                              ? 'Today'
                              : `In ${f.daysUntil} days`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reason & Diagnosis */}
                    {f.nextVisitReason && (
                      <div className="mb-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <p className="text-xs font-medium text-amber-700 mb-1">Reason for Visit:</p>
                        <p className="text-sm text-amber-800">{f.nextVisitReason}</p>
                      </div>
                    )}
                    {f.diagnosis && (
                      <div className="mb-2 bg-purple-50 border border-purple-200 rounded-lg p-2">
                        <p className="text-xs font-medium text-purple-700 mb-1">Previous Diagnosis:</p>
                        <p className="text-sm text-purple-800">{f.diagnosis}</p>
                      </div>
                    )}
                    {f.symptoms && (
                      <div className="mb-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                        <p className="text-xs font-medium text-slate-600 mb-1">Previous Symptoms:</p>
                        <p className="text-sm text-slate-700">{f.symptoms}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {f.followUpNotes && (
                      <div className="bg-white/50 rounded-lg p-2 mb-3">
                        <div className="flex items-start gap-2">
                          <ChatBubbleLeftRightIcon className="h-4 w-4 text-slate-500 mt-0.5" />
                          <p className="text-sm text-slate-700">{f.followUpNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!f.followUpContacted && (
                        <button
                          onClick={() => handleMarkContacted(f)}
                          className="btn btn-primary btn-sm flex-1"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Mark Done
                        </button>
                      )}
                      <a
                        href={`tel:${f.client?.mobile}`}
                        className="btn btn-secondary btn-sm flex-1"
                      >
                        <PhoneIcon className="h-4 w-4" />
                        Call
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Client</th>
                      <th>Pet</th>
                      <th>Follow-up Date</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followups.map((f) => (
                      <tr key={f._id} className="hover:bg-slate-50">
                        <td>
                          <span className={`badge ${f.followUpContacted ? 'badge-green' : f.isOverdue ? 'badge-red' : 'badge-amber'}`}>
                            {getStatusLabel(f)}
                          </span>
                        </td>
                        <td>
                          <p className="font-medium">{f.client?.name}</p>
                          <p className="text-xs text-slate-500">{f.client?.mobile}</p>
                        </td>
                        <td>
                          <p className="font-medium">{f.pet?.name}</p>
                          <p className="text-xs text-slate-500">{f.pet?.species}</p>
                        </td>
                        <td>
                          <p className="font-medium">{formatDate(f.followUpDate)}</p>
                          <p className="text-xs text-slate-500">
                            {f.isOverdue
                              ? `${Math.abs(f.daysUntil)} days overdue`
                              : f.daysUntil === 0
                              ? 'Today'
                              : `In ${f.daysUntil} days`}
                          </p>
                        </td>
                        <td>
                          <p className="text-sm text-slate-700 max-w-xs truncate">{f.nextVisitReason || '-'}</p>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            {!f.followUpContacted && (
                              <button
                                onClick={() => handleMarkContacted(f)}
                                className="btn btn-primary btn-sm"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            )}
                            <a
                              href={`tel:${f.client?.mobile}`}
                              className="btn btn-secondary btn-sm"
                            >
                              <PhoneIcon className="h-4 w-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Mark Contacted Modal */}
      {selectedFollowup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Mark Follow-up as Contacted</h3>
            <div className="mb-4 p-3 bg-slate-50 rounded-lg text-sm space-y-3">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-slate-500" />
                <div>
                  <p><span className="font-medium">Client:</span> {selectedFollowup.client?.name}</p>
                  <p className="text-xs text-slate-500">ID: {selectedFollowup.client?.clientId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BeakerIcon className="h-4 w-4 text-slate-500" />
                <div>
                  <p><span className="font-medium">Pet:</span> {selectedFollowup.pet?.name}</p>
                  <p className="text-xs text-slate-500">{selectedFollowup.pet?.species} {selectedFollowup.pet?.breed && `· ${selectedFollowup.pet.breed}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 text-blue-600" />
                <div>
                  <p><span className="font-medium text-blue-600">Phone:</span> 
                    <a href={`tel:${selectedFollowup.client?.mobile}`} className="font-bold text-blue-800 hover:underline ml-1">
                      {selectedFollowup.client?.mobile}
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-slate-500" />
                <p><span className="font-medium">Follow-up Date:</span> {formatDate(selectedFollowup.followUpDate)}</p>
              </div>
              {selectedFollowup.nextVisitReason && (
                <div className="bg-amber-50 p-2 rounded">
                  <p><span className="font-medium text-amber-700">Reason:</span> {selectedFollowup.nextVisitReason}</p>
                </div>
              )}
              {selectedFollowup.diagnosis && (
                <div className="bg-purple-50 p-2 rounded">
                  <p><span className="font-medium text-purple-700">Previous Diagnosis:</span> {selectedFollowup.diagnosis}</p>
                </div>
              )}
              {selectedFollowup.symptoms && (
                <div className="bg-slate-100 p-2 rounded">
                  <p><span className="font-medium text-slate-600">Previous Symptoms:</span> {selectedFollowup.symptoms}</p>
                </div>
              )}
            </div>
            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div>
                <label className="label">Contact Notes</label>
                <textarea
                  className="input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about the follow-up contact..."
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={handleCancel} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={updating} className="btn-primary flex-1">
                  {updating ? 'Saving...' : 'Mark Contacted'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
