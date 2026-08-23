'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../lib/context';
import { Award, Trophy, Star, Filter, Landmark, Sparkles, Vote, Flame } from 'lucide-react';

export default function Leaderboard() {
  const { currentUser, getLeaderboard, schools } = useApp();
  const [scope, setScope] = useState<'school' | 'grade' | 'county'>('school');
  const [selectedGrade, setSelectedGrade] = useState<number>(12); // Defaults to senior class for grade scope

  if (!currentUser) return null;

  // Active filters based on scope selection
  const leaderboardData = useMemo(() => {
    switch (scope) {
      case 'school':
        return getLeaderboard(currentUser.school_id, undefined, false);
      case 'grade':
        return getLeaderboard(currentUser.school_id, selectedGrade, false);
      case 'county':
        return getLeaderboard(undefined, undefined, true);
      default:
        return [];
    }
  }, [scope, selectedGrade, currentUser.school_id, getLeaderboard]);

  // Calculate aggregate stats for this week's active scope
  const totalWeeklyVotes = useMemo(() => {
    return leaderboardData.reduce((sum, item) => sum + (item.compliment_count || 0), 0);
  }, [leaderboardData]);

  const mySchoolName = schools.find(s => s.id === currentUser.school_id)?.name || 'My School';

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 text-zinc-950 font-extrabold text-sm animate-bounce">
            👑
          </div>
        );
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 via-slate-300 to-slate-400 flex items-center justify-center shadow-lg shadow-slate-300/30 text-zinc-950 font-extrabold text-sm">
            🥈
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-amber-700 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-800/30 text-zinc-950 font-extrabold text-sm">
            🥉
          </div>
        );
      default:
        return (
          <span className="w-8 h-8 flex items-center justify-center text-gray-500 font-bold text-sm">
            #{index + 1}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Filtering Navigation Row */}
      <div className="bg-card backdrop-blur-glass border border-white/10 rounded-2xl p-2 flex flex-wrap gap-1 shadow-md">
        <button
          onClick={() => setScope('school')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
            scope === 'school'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          My School
        </button>

        <button
          onClick={() => setScope('grade')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
            scope === 'grade'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          By Grade Level
        </button>

        <button
          onClick={() => setScope('county')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
            scope === 'county'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Broward County Overall
        </button>
      </div>

      {/* Secondary filter if scope is 'grade' */}
      {scope === 'grade' && (
        <div className="flex items-center justify-between bg-card/40 border border-white/5 rounded-2xl p-4 animate-fadeIn">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-primary" />
            Filter by Grade Level:
          </span>
          <div className="flex gap-1.5">
            {[9, 10, 11, 12].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`w-10 h-8 rounded-lg text-xs font-bold transition-all ${
                  selectedGrade === g
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {g}th
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Stats Counter Card */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-slate-900/60 border border-indigo-500/30 rounded-3xl p-5 backdrop-blur-xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">Weekly Activity</p>
            <h3 className="text-lg font-bold text-white">Total Votes This Week</h3>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-cyan-400 flex items-center justify-end gap-1">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
            {totalWeeklyVotes.toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Votes Cast</span>
        </div>
      </div>

      {/* Leaderboard Rankings */}
      <div className="bg-card backdrop-blur-glass border border-white/10 rounded-3xl p-5 shadow-glass space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            {scope === 'school' && `Top Complimented at ${mySchoolName}`}
            {scope === 'grade' && `${selectedGrade}th Grade Class Standings`}
            {scope === 'county' && 'Broward County Top Leaders'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Realtime updates enabled. Point totals sync automatically.
          </p>
        </div>

        <div className="divide-y divide-white/5 space-y-2">
          {leaderboardData.length > 0 ? (
            leaderboardData.map((stat, idx) => {
              const isCurrentUser = stat.profile_id === currentUser.id;
              return (
                <div
                  key={stat.profile_id}
                  className={`flex items-center justify-between py-3 px-4 rounded-2xl transition-all ${
                    isCurrentUser
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-white/0 hover:bg-white/5 border border-transparent'
                  } ${stat.perks_enabled ? 'ring-1 ring-amber-500/30' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Position / Medal */}
                    {getRankBadge(idx)}

                    {/* Student Identity */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold text-sm ${isCurrentUser ? 'text-primary' : 'text-white'}`}>
                          {stat.full_name}
                        </span>
                        {stat.perks_enabled && (
                          <span className="inline-flex items-center gap-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5 fill-amber-300" />
                            Perk Badge
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                        <span>@{stat.username}</span>
                        <span>•</span>
                        <span>{stat.school_name}</span>
                        <span>•</span>
                        <span>Grade {stat.grade}</span>
                      </div>
                    </div>
                  </div>

                  {/* Compliment count */}
                  <div className="text-right">
                    <span className="text-base font-black text-white bg-white/5 px-3 py-1.5 rounded-xl block min-w-[3rem] text-center border border-white/5 shadow-inner">
                      {stat.compliment_count}
                    </span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mt-0.5">
                      votes
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-sm text-gray-500">
              No students are currently ranked on this leaderboard. Be the first to vote!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
