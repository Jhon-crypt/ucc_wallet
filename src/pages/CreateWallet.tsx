import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { UCCWallet } from '../utils/UCCWallet';

export default function CreateWallet() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateWallet = async () => {
    try {
      setIsGenerating(true);
      const wallet = new UCCWallet();
      const { mnemonic, address } = await wallet.generateWallet();
      
      // Store mnemonic and address in local storage
      localStorage.setItem('mnemonic', mnemonic);
      localStorage.setItem('address', address);

      // Navigate to confirm mnemonic page
      navigate('/confirm-mnemonic');
    } catch (error) {
      console.error('Error generating wallet:', error);
      toast.error('Failed to generate wallet');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-lg p-8 space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-gradient">Create New Wallet</h1>
              <p className="text-gray-400">
                Generate a new wallet with a secure mnemonic phrase
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleGenerateWallet}
                className="w-full"
                isLoading={isGenerating}
                disabled={isGenerating}
              >
                Generate Wallet
              </Button>

              <p className="text-sm text-gray-400 text-center">
                Already have a wallet?{' '}
                <button
                  onClick={() => navigate('/import-wallet')}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Import existing wallet
                </button>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
} 