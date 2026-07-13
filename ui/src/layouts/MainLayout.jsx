import EnterpriseHeader from '../components/EnterpriseHeader';
import Footer from '../components/Footer';
import AnnouncementModal from '../components/AnnouncementModal';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-foreground">
      <EnterpriseHeader />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <AnnouncementModal />
    </div>
  );
};

export default MainLayout;