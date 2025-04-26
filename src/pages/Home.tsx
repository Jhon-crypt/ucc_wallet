import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { UCCWallet } from '../utils/UCCWallet';

export default function Home() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleConnect = async () => {
    try {
      const wallet = new UCCWallet();
      const walletInfo = await wallet.connectWallet();
      localStorage.setItem('walletInfo', JSON.stringify(walletInfo));
      toast.success('Wallet connected successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  return (
    <Layout>
      <div className="relative flex flex-col items-center justify-center min-h-screen">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-black" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-lg px-4"
        >
          <Card className="w-full p-8 space-y-8 bg-gray-900/80 backdrop-blur-xl border border-purple-500/20">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <img 
                  src="/metamask.svg" 
                  alt="MetaMask" 
                  className="w-24 h-24 mx-auto mb-6 drop-shadow-glow"
                />
              </motion.div>
              
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Welcome to UCC Wallet
              </h1>
              <p className="text-gray-400 text-lg">
                Connect with MetaMask to access your Universe Chain wallet
              </p>
            </div>

            <div className="flex flex-col items-center space-y-6">
              <Button
                onClick={() => setShowModal(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 py-4 text-lg font-medium"
              >
                <div className="flex items-center justify-center gap-3">
                  <img src="/metamask.svg" alt="" className="w-6 h-6" />
                  Connect with MetaMask
                </div>
              </Button>

              {!window.ethereum && (
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Install MetaMask
                </a>
              )}
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>New to Universe Chain?</p>
              <a 
                href="https://docs.universechain.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Learn more about our ecosystem →
              </a>
            </div>
          </Card>
        </motion.div>

        {/* Connection Guide Modal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-xl p-6 max-w-lg w-full border border-purple-500/20"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-500/20 rounded-full text-purple-400">1</div>
                  <p>Make sure MetaMask is installed and unlocked</p>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-500/20 rounded-full text-purple-400">2</div>
                  <p>Switch to Universe Chain network (will be added automatically)</p>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-500/20 rounded-full text-purple-400">3</div>
                  <p>Approve the connection request in MetaMask</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowModal(false);
                    handleConnect();
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Connect Now
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        .drop-shadow-glow {
          filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.4));
        }
      `}</style>
    </Layout>
  );
}