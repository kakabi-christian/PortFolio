import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './Context/ThemeContext';
import Header from './Components/Header';
import Home from './Pages/Home';
import About from './Pages/About';
import Skills from './Pages/Skills';
import Contact from './Pages/Contact';
import Project from './Pages/Project';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import Profile from './Pages/Admin/Profile';
import FrameworkPage from './Pages/Admin/FrameworkPage';
import DatabasePage from './Pages/Admin/DatabasePage';
import ToolPage from './Pages/Admin/ToolPage';
import ContactPage from './Pages/Admin/ContactPage';
import ProjectPage from './Pages/Admin/ProjectPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Header />
        <main>
          <Routes>
            {/* Routes Publiques */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/project" element={<Project />} /> 
            <Route path="/login" element={<Login />} />
            
            {/* Routes Admin (avec enfants) */}
            <Route path="/admin/*" element={<Dashboard />}>
              <Route path="profile" element={<Profile />} />
              <Route path="frameworks" element={<FrameworkPage />} />
              <Route path="tools" element={<ToolPage />} />
              <Route path="databases" element={<DatabasePage />} />
              <Route path="contacts" element={<ContactPage />} />
              <Route path="projects" element={<ProjectPage />} />
            </Route> 
          </Routes>
        </main>
      </Router>
    </ThemeProvider>
  );
}

export default App;