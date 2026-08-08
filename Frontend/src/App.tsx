import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import About from './Pages/About';
import Skills from './Pages/Skills';
import Contact from './Pages/Contact';
import Project from './Pages/Project';
import Login from './Pages/Login';

function App() {
  return (
    <Router>
      <main>
        <Routes>
          {/* {/* Routes Publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/project" element={<Project />} /> 
          <Route path="/login" element={<Login />} />
          
         

          {/* Routes Admin (avec enfants) */}
          {/* <Route path="/admin/*" element={<AdminDashboard />}>
            <Route path="type-documents" element={<TypeDocumentPage />} />
          </Route> */}

        </Routes>
      </main>
    </Router>
  );
}

export default App;