import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnnouncementModal from '../components/AnnouncementModal';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <AnnouncementModal />
    </div>
  );
};

export default MainLayout;