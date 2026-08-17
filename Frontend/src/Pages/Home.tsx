import Header from '../Components/Header'
import HomeContent from '../Contents/HomeContent'
import Footer from '../Components/Footer'
import AboutContent from '../Contents/AboutContent'
import SkillsContent from '../Contents/SkillsContent'
import ProjectsContent from '../Contents/ProjectsContent'
import ContactContent from '../Contents/ContactContent'
export default function Home() {
  return (
    <div>
      <Header />
      <HomeContent />
      {/* <AboutContent />
      <SkillsContent />
      <ProjectsContent />
      <ContactContent /> */}
      <Footer />
    </div>
  )
}
