import { Routes, Route } from "react-router-dom";
import Home from "./Home.jsx";
import Testing from "./Testing.jsx";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/testing" element={<Testing />} />
        </Routes>
    );
}