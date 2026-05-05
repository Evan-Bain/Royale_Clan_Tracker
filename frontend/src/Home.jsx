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
  { key: "fame", title: "War Fame", color: "#ff6b6b" },
  { key: "decksUsed", title: "Decks Used", color: "#8db7ff" },
  { key: "boatAttacks", title: "Boat Attacks", color: "#b455ff" },
];

function normalizeTag(tag = "") {
  return tag.replaceAll("#", "").toUpperCase();
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function mergeMemberData(members, riverRace) {
  const participants = riverRace?.clan?.participants ?? [];
  const participantsByTag = new Map(
    participants.map((participant) => [normalizeTag(participant.tag), participant])
  );

  return members
    .map((member) => {
      const warStats = participantsByTag.get(normalizeTag(member.tag)) ?? {};
      const donations = toNumber(member.donations);
      const donationsReceived = toNumber(member.donationsReceived);
      const fame = toNumber(warStats.fame);
      const repairPoints = toNumber(warStats.repairPoints);
      const boatAttacks = toNumber(warStats.boatAttacks);
      const decksUsed = toNumber(warStats.decksUsed);
      const participationScore =
        donations + donationsReceived + fame + repairPoints + boatAttacks * 100 + decksUsed * 50;

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
        decksUsedToday: toNumber(warStats.decksUsedToday),
        participationScore,
      };
    })
    .sort(
      (a, b) =>
        b.participationScore - a.participationScore ||
        b.donations - a.donations ||
        b.fame - a.fame ||
        a.rank - b.rank
    );
}

function buildChartData(members, metricKey) {
  return [...members]
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rankedMembers = useMemo(() => mergeMemberData(members, riverRace), [members, riverRace]);
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

      const cleanTag = normalizeTag(clanTag);

      const [clanRes, membersRes, riverRaceRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/group`, { params: { groupId: cleanTag } }),
        axios.get(`${API_BASE_URL}/group/members`, { params: { groupId: cleanTag } }),
        axios.get(`${API_BASE_URL}/group/current-river-race`, { params: { groupId: cleanTag } }),
      ]);

      setClan(clanRes.data);
      setMembers(membersRes.data.members ?? membersRes.data.items ?? []);
      setRiverRace(riverRaceRes.data);
    } catch {
      setClan(null);
      setMembers([]);
      setRiverRace(null);
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
          <h2>Members</h2>
          <p className="subtitle">Ranked by participation</p>

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
                    <span>{member.role}</span>
                    <span>Clan rank #{member.rank}</span>
                  </div>
                  <div className="memberStats">
                    <span>{NUMBER_FORMAT.format(member.donations)} donated</span>
                    <span>{NUMBER_FORMAT.format(member.fame)} fame</span>
                    <span>{NUMBER_FORMAT.format(member.decksUsed)} decks</span>
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
            <div>
              <span>Clan Fame</span>
              <strong>{NUMBER_FORMAT.format(riverRace?.clan?.fame ?? 0)}</strong>
            </div>
            <div>
              <span>Repair Points</span>
              <strong>{NUMBER_FORMAT.format(riverRace?.clan?.repairPoints ?? 0)}</strong>
            </div>
            <div>
              <span>War Participants</span>
              <strong>{NUMBER_FORMAT.format(riverRace?.clan?.participants?.length ?? 0)}</strong>
            </div>
          </div>

          <div className="chartGrid">
            {CHART_METRICS.map((metric) => (
              <section className="statPanel chartPanel" key={metric.key}>
                <div className="chartHeader">
                  <h3>{metric.title}</h3>
                  <span>Top 8</span>
                </div>

                {loading ? (
                  <p className="emptyText">Loading chart data...</p>
                ) : rankedMembers.length === 0 ? (
                  <p className="emptyText">Search a clan to load chart data.</p>
                ) : (
                  <div className="chartFrame">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartDataByMetric[metric.key]}
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
            ))}
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
