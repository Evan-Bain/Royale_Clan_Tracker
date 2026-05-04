import { useState } from "react";
import axios from "axios";
import "./Home.css";

export default function Home() {
  const [clanTag, setClanTag] = useState("R2L0YPGL");
  const [clan, setClan] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

  async function searchClan() {
    try {
      setError("");

      const cleanTag = clanTag.replace("#", "");

      const clanRes = await axios.get(
        "http://localhost:8080/api/games/clash-royale/group",
        { params: { groupId: cleanTag } }
      );

      const membersRes = await axios.get(
        "http://localhost:8080/api/games/clash-royale/group/members",
        { params: { groupId: cleanTag } }
      );

      setClan(clanRes.data);
      setMembers(membersRes.data.members ?? membersRes.data.items ?? []);
    } catch {
      setError("Could not find clan. Check the clan tag or make sure backend is running.");
    }
  }

  return (
    <div className="page">
      <header className="topBar">
        <div>
          <h1>Clash Royale Clan Tracker</h1>
          <p>Search clans, view members, and track clan activity.</p>
        </div>

        <div className="searchBox">
          <input
            value={clanTag}
            onChange={(e) => setClanTag(e.target.value)}
            placeholder="Enter clan tag"
          />
          <button onClick={searchClan}>Search Clan</button>
        </div>
      </header>

      {error && <div className="errorBox">{error}</div>}

      <main className="dashboard">
        <section className="membersCard">
          <h2>Members</h2>
          <p className="subtitle">Ranked by participation</p>

          <div className="memberList">
            {members.length === 0 ? (
              <p className="emptyText">Search a clan to load members.</p>
            ) : (
              members.map((member, index) => (
                <div className="memberRow" key={member.tag}>
                  <span className="rank">{index + 1}</span>
                  <span>{member.name}</span>
                  <span className="tag">{member.tag}</span>
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
              {clan ? `${clan.members} Members` : "0 Members"}
            </div>
          </div>

          <div className="statPanel">
            <h3>War at a Glance</h3>
            <div className="fakeGraph warGraph"></div>
          </div>

          <div className="statPanel">
            <h3>Donations at a Glance</h3>
            <div className="fakeGraph donationGraph"></div>
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
