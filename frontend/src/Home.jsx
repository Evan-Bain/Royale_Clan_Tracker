import { useMemo, useState } from "react";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./Home.css";

const API_BASE_URL = "http://localhost:8080/api/games/clash-royale";
const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

const CHART_METRICS = [
  { key: "participationScore", title: "Top Participation Score", color: "#ffd15c" },
  { key: "donations", title: "Top Donations", color: "#80ffb0" },
  { key: "fame", title: "War Fame", color: "#ff6b6b", requiresWarData: true },
  { key: "decksUsed", title: "Decks Used", color: "#8db7ff", requiresWarData: true },
  { key: "boatAttacks", title: "Boat Attacks", color: "#b455ff", requiresWarData: true },
];

const SORT_OPTIONS = [
  { key: "participationScore", label: "Participation Score", direction: "desc" },
  { key: "donations", label: "Donations", direction: "desc" },
  { key: "donationsReceived", label: "Donations Received", direction: "desc" },
  { key: "fame", label: "War Fame", direction: "desc" },
  { key: "decksUsed", label: "Decks Used", direction: "desc" },
  { key: "boatAttacks", label: "Boat Attacks", direction: "desc" },
  { key: "trophies", label: "Trophies", direction: "desc" },
  { key: "rank", label: "Clan Rank", direction: "asc" },
];

function normalizeTag(tag = "") {
  return tag.replaceAll("#", "").toUpperCase();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toNullableNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatStat(value) {
  return value === null || value === undefined ? "--" : NUMBER_FORMAT.format(value);
}

function formatPercent(value) {
  return value === null || value === undefined ? "--" : `${formatStat(Math.round(value))}%`;
}

function formatClanType(type) {
  if (!type) {
    return "--";
  }

  return type
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function getRequestErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return `River race request failed: ${error.response.status}`;
    }

    if (error.request) {
      return "River race request failed: no response";
    }
  }

  return error instanceof Error ? error.message : "Unknown river race error";
}

function getActivityProfile(member) {
  if (member.participationScore >= 100) {
    return { label: "Top Contributor", className: "topContributor" };
  }

  if ((member.fame ?? 0) > 0 || (member.decksUsed ?? 0) > 0 || (member.boatAttacks ?? 0) > 0) {
    return { label: "War Active", className: "warActive" };
  }

  if (member.donations > 0) {
    return { label: "Donator", className: "donator" };
  }

  return { label: "Low Activity", className: "lowActivity" };
}

function mergeMemberData(members, riverRace) {
  const participants = riverRace?.clan?.participants ?? [];
  const participantsByTag = new Map(
    participants.map((participant) => [normalizeTag(participant.tag), participant])
  );

  return members
    .map((member) => {
      const warStats = participantsByTag.get(normalizeTag(member.tag));
      const donations = toNumber(member.donations);
      const donationsReceived = toNumber(member.donationsReceived);
      const fame = warStats ? toNullableNumber(warStats.fame) : null;
      const repairPoints = warStats ? toNullableNumber(warStats.repairPoints) : null;
      const boatAttacks = warStats ? toNullableNumber(warStats.boatAttacks) : null;
      const decksUsed = warStats ? toNullableNumber(warStats.decksUsed) : null;
      const warScore =
        (fame ?? 0) + (repairPoints ?? 0) + (boatAttacks ?? 0) * 100 + (decksUsed ?? 0) * 50;
      const participationScore =
        donations + donationsReceived + warScore;
      const activityProfile = getActivityProfile({
        donations,
        fame,
        decksUsed,
        boatAttacks,
        participationScore,
      });

      return {
        ...member,
        rank: toNumber(member.rank ?? member.clanRank),
        role: member.role ?? "member",
        donations,
        donationsReceived,
        trophies: toNumber(member.trophies),
        fame,
        repairPoints,
        boatAttacks,
        decksUsed,
        decksUsedToday: warStats ? toNullableNumber(warStats.decksUsedToday) : null,
        hasWarData: Boolean(warStats),
        donationBalance: donations - donationsReceived,
        activityLabel: activityProfile.label,
        activityClass: activityProfile.className,
        participationScore,
      };
    });
}

function getSortValue(value, direction) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
}

function sortMembers(members, sortKey) {
  const option = SORT_OPTIONS.find((sortOption) => sortOption.key === sortKey) ?? SORT_OPTIONS[0];

  return [...members].sort((a, b) => {
    const aValue = getSortValue(a[option.key], option.direction);
    const bValue = getSortValue(b[option.key], option.direction);
    const metricDifference = option.direction === "asc" ? aValue - bValue : bValue - aValue;

    return (
      metricDifference ||
      b.participationScore - a.participationScore ||
      b.donations - a.donations ||
      a.rank - b.rank ||
      a.name.localeCompare(b.name)
    );
  });
}

function buildChartData(members, metricKey) {
  return [...members]
    .filter((member) => typeof member[metricKey] === "number" && Number.isFinite(member[metricKey]))
    .sort(
      (a, b) =>
        b[metricKey] - a[metricKey] ||
        b.participationScore - a.participationScore ||
        a.rank - b.rank
    )
    .slice(0, 8)
    .map((member) => ({
      name: member.name,
      value: member[metricKey],
    }));
}

function getHealthStatus(score) {
  if (score === null) {
    return "No Data";
  }

  if (score >= 90) {
    return "Elite Activity";
  }

  if (score >= 75) {
    return "Active Clan";
  }

  if (score >= 50) {
    return "Needs Improvement";
  }

  return "Low Activity";
}

function calculateClanHealth(members, hasRiverRaceData) {
  const totalMembers = members.length;

  if (totalMembers === 0) {
    return {
      score: null,
      status: "No Data",
      activeMembersPercent: null,
      donationParticipationPercent: null,
      warParticipationPercent: null,
      isPartial: false,
    };
  }

  const activeMembersPercent =
    (members.filter((member) => member.participationScore > 0).length / totalMembers) * 100;
  const donationParticipationPercent =
    (members.filter((member) => member.donations > 0 || member.donationsReceived > 0).length /
      totalMembers) *
    100;
  const warParticipationPercent = hasRiverRaceData
    ? (members.filter(
        (member) =>
          member.hasWarData &&
          ((member.fame ?? 0) > 0 ||
            (member.repairPoints ?? 0) > 0 ||
            (member.boatAttacks ?? 0) > 0 ||
            (member.decksUsed ?? 0) > 0)
      ).length /
        totalMembers) *
      100
    : null;

  const availableWeight = hasRiverRaceData ? 1 : 0.7;
  const rawScore =
    activeMembersPercent * 0.4 +
    donationParticipationPercent * 0.3 +
    (warParticipationPercent ?? 0) * 0.3;
  const score = Math.round(rawScore / availableWeight);

  return {
    score,
    status: getHealthStatus(score),
    activeMembersPercent,
    donationParticipationPercent,
    warParticipationPercent,
    isPartial: !hasRiverRaceData,
  };
}

function getLowActivityMembers(members, hasRiverRaceData) {
  return members.filter((member) => {
    const hasClanActivity = member.donations > 0 || member.donationsReceived > 0;
    const hasWarActivity =
      hasRiverRaceData &&
      ((member.fame ?? 0) > 0 ||
        (member.repairPoints ?? 0) > 0 ||
        (member.boatAttacks ?? 0) > 0 ||
        (member.decksUsed ?? 0) > 0);

    return !hasClanActivity && !hasWarActivity;
  });
}

function buildOverviewStats(clan) {
  return [
    { label: "Clan Score", value: formatStat(toNullableNumber(clan?.clanScore)) },
    { label: "War Trophies", value: formatStat(toNullableNumber(clan?.clanWarTrophies)) },
    {
      label: "Members",
      value: clan ? `${formatStat(toNullableNumber(clan.members))} / 50` : "--",
    },
    { label: "Required Trophies", value: formatStat(toNullableNumber(clan?.requiredTrophies)) },
    { label: "Weekly Donations", value: formatStat(toNullableNumber(clan?.donationsPerWeek)) },
    { label: "Clan Type", value: formatClanType(clan?.type) },
  ];
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chartTooltip">
      <strong>{label}</strong>
      <span>{NUMBER_FORMAT.format(payload[0].value)}</span>
    </div>
  );
}

export default function Home() {
  const [clanTag, setClanTag] = useState("R2L0YPGL");
  const [clan, setClan] = useState(null);
  const [members, setMembers] = useState([]);
  const [riverRace, setRiverRace] = useState(null);
  const [riverRaceError, setRiverRaceError] = useState("");
  const [sortMetric, setSortMetric] = useState("participationScore");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasRiverRaceData = Array.isArray(riverRace?.clan?.participants);
  const mergedMembers = useMemo(() => mergeMemberData(members, riverRace), [members, riverRace]);
  const rankedMembers = useMemo(
    () => sortMembers(mergedMembers, sortMetric),
    [mergedMembers, sortMetric]
  );
  const overviewStats = useMemo(() => buildOverviewStats(clan), [clan]);
  const clanHealth = useMemo(
    () => calculateClanHealth(mergedMembers, hasRiverRaceData),
    [mergedMembers, hasRiverRaceData]
  );
  const lowActivityMembers = useMemo(
    () => getLowActivityMembers(rankedMembers, hasRiverRaceData).slice(0, 5),
    [rankedMembers, hasRiverRaceData]
  );
  const chartDataByMetric = useMemo(
    () =>
      CHART_METRICS.reduce(
        (chartData, metric) => ({
          ...chartData,
          [metric.key]: buildChartData(rankedMembers, metric.key),
        }),
        {}
      ),
    [rankedMembers]
  );

  async function searchClan() {
    try {
      setLoading(true);
      setError("");
      setRiverRace(null);
      setRiverRaceError("");

      const cleanTag = normalizeTag(clanTag);

      const riverRaceRequest = axios
        .get(`${API_BASE_URL}/group/current-river-race`, { params: { groupId: cleanTag } })
        .then((response) => ({ data: response.data, error: "" }))
        .catch((requestError) => ({ data: null, error: getRequestErrorMessage(requestError) }));

      const [clanRes, membersRes, riverRaceResult] = await Promise.all([
        axios.get(`${API_BASE_URL}/group`, { params: { groupId: cleanTag } }),
        axios.get(`${API_BASE_URL}/group/members`, { params: { groupId: cleanTag } }),
        riverRaceRequest,
      ]);

      const memberData = membersRes.data.members ?? membersRes.data.items ?? [];

      if (import.meta.env.DEV) {
        console.table([
          {
            name: clanRes.data.name,
            type: clanRes.data.type,
            clanScore: clanRes.data.clanScore,
            clanWarTrophies: clanRes.data.clanWarTrophies,
            requiredTrophies: clanRes.data.requiredTrophies,
            donationsPerWeek: clanRes.data.donationsPerWeek,
            members: clanRes.data.members,
          },
        ]);

        console.table(
          memberData.slice(0, 8).map((member) => ({
            name: member.name,
            tag: member.tag,
            role: member.role,
            rank: member.rank ?? member.clanRank,
            trophies: member.trophies,
            donations: member.donations,
            donationsReceived: member.donationsReceived,
          }))
        );

        console.table(
          (riverRaceResult.data?.clan?.participants ?? []).slice(0, 8).map((participant) => ({
            name: participant.name,
            tag: participant.tag,
            fame: participant.fame,
            repairPoints: participant.repairPoints,
            boatAttacks: participant.boatAttacks,
            decksUsed: participant.decksUsed,
          }))
        );
      }

      setClan(clanRes.data);
      setMembers(memberData);
      if (riverRaceResult.error) {
        setRiverRace(null);
        setRiverRaceError(riverRaceResult.error);
      } else if (!Array.isArray(riverRaceResult.data?.clan?.participants)) {
        setRiverRace(null);
        setRiverRaceError("River race response did not include participants.");
      } else {
        setRiverRace(riverRaceResult.data);
        setRiverRaceError("");
      }
    } catch {
      setClan(null);
      setMembers([]);
      setRiverRace(null);
      setRiverRaceError("");
      setError("Could not load clan data. Check the clan tag or make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="topBar">
        <div>
          <h1>Clash Royale Clan Tracker</h1>
          <p>Search clans, view members, and track clan activity.</p>
        </div>

        <form
          className="searchBox"
          onSubmit={(event) => {
            event.preventDefault();
            searchClan();
          }}
        >
          <input
            value={clanTag}
            onChange={(e) => setClanTag(e.target.value)}
            placeholder="Enter clan tag"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search Clan"}
          </button>
        </form>
      </header>

      {error && <div className="errorBox">{error}</div>}

      <main className="dashboard">
        <section className="membersCard">
          <div className="membersHeader">
            <div>
              <h2>Members</h2>
              <p className="subtitle">Ranked by activity</p>
            </div>

            <label className="sortControl">
              <span>Sort by</span>
              <select value={sortMetric} onChange={(event) => setSortMetric(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option value={option.key} key={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="memberList">
            {loading ? (
              <p className="emptyText">Loading members...</p>
            ) : rankedMembers.length === 0 ? (
              <p className="emptyText">Search a clan to load members.</p>
            ) : (
              rankedMembers.map((member, index) => (
                <div className="memberRow" key={member.tag}>
                  <span className="rank">{index + 1}</span>
                  <div className="memberIdentity">
                    <strong>{member.name}</strong>
                    <span className="tag">{member.tag}</span>
                  </div>
                  <div className="memberScore">
                    <strong>{NUMBER_FORMAT.format(member.participationScore)}</strong>
                    <span>score</span>
                  </div>
                  <div className="memberMeta">
                    <span className={`activityPill ${member.activityClass}`}>
                      {member.activityLabel}
                    </span>
                    <span>{member.role}</span>
                    <span>Clan rank #{member.rank}</span>
                  </div>
                  <div className="memberStats">
                    <span>{NUMBER_FORMAT.format(member.donations)} donated</span>
                    <span>{formatStat(member.donationsReceived)} received</span>
                    <span>{formatStat(member.fame)} fame</span>
                    <span>{formatStat(member.decksUsed)} decks</span>
                    <span>{formatStat(member.boatAttacks)} boat attacks</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mainCard">
          <div className="clanHeader">
            <div>
              <p className="label">Clan Name</p>
              <h2>{clan ? clan.name : "No Clan Selected"}</h2>
            </div>
            <div className="badge">
              {clan ? `${NUMBER_FORMAT.format(clan.members)} Members` : "0 Members"}
            </div>
          </div>

          <div className="summaryGrid">
            {overviewStats.map((stat) => (
              <div key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>

          {riverRaceError && <div className="warNotice">War data unavailable: {riverRaceError}</div>}

          <div className="insightGrid">
            <section className="healthPanel">
              <div className="panelHeader">
                <h3>Clan Health</h3>
                {clanHealth.isPartial && <span>Partial</span>}
              </div>

              <div className="healthScore">
                <strong>{formatStat(clanHealth.score)}</strong>
                <span>/ 100</span>
              </div>
              <p>{clanHealth.status}</p>

              <div className="healthBreakdown">
                <span>Active {formatPercent(clanHealth.activeMembersPercent)}</span>
                <span>Donations {formatPercent(clanHealth.donationParticipationPercent)}</span>
                <span>War {formatPercent(clanHealth.warParticipationPercent)}</span>
              </div>
            </section>

            <section className="attentionPanel">
              <div className="panelHeader">
                <h3>Members Needing Activity</h3>
                <span>{lowActivityMembers.length}</span>
              </div>

              {loading ? (
                <p className="emptyText">Checking activity...</p>
              ) : lowActivityMembers.length === 0 ? (
                <p className="emptyText">No low-activity members found.</p>
              ) : (
                <div className="attentionList">
                  {lowActivityMembers.map((member) => (
                    <div className="attentionRow" key={member.tag}>
                      <strong>{member.name}</strong>
                      <span>
                        {formatStat(member.donations)} donations, {formatStat(member.fame)} fame,{" "}
                        {formatStat(member.decksUsed)} decks
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="chartGrid">
            {CHART_METRICS.map((metric) => {
              const chartRows = chartDataByMetric[metric.key] ?? [];

              return (
                <section className="statPanel chartPanel" key={metric.key}>
                  <div className="chartHeader">
                    <h3>{metric.title}</h3>
                    <span>Top 8</span>
                  </div>

                  {loading ? (
                    <p className="emptyText">Loading chart data...</p>
                  ) : rankedMembers.length === 0 ? (
                    <p className="emptyText">Search a clan to load chart data.</p>
                  ) : chartRows.length === 0 ? (
                    <p className="emptyText">
                      {metric.requiresWarData && riverRaceError
                        ? "War data unavailable."
                        : "No chart data available."}
                    </p>
                  ) : (
                    <div className="chartFrame">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartRows}
                          layout="vertical"
                          margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                        >
                          <CartesianGrid stroke="#4f69b6" strokeDasharray="3 3" horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fill: "#dbe7ff", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={94}
                            tick={{ fill: "#ffffff", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.08)" }} />
                          <Bar dataKey="value" fill={metric.color} radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>
      </main>

      <footer>
        This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell. 
          Clash Royale and related assets are trademarks of Supercell.
        </footer>
    </div>
  );
}
