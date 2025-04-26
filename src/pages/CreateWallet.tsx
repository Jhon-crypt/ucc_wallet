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
  const [mnemonic, setMnemonic] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateWallet = async () => {
    try {
      setIsLoading(true);
      const wallet = new UCCWallet();
      const newWallet = await wallet.generateWallet();
      setMnemonic(newWallet.mnemonic || '');
      toast.success('Wallet generated successfully!');
    } catch (error) {
      console.error('Error generating wallet:', error);
      toast.error('Failed to generate wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    toast.success('Mnemonic copied to clipboard!');
  };

  const handleProceed = () => {
    if (!mnemonic) {
      toast.error('Please generate a wallet first');
      return;
    }
    navigate('/confirm-mnemonic', { state: { mnemonic } });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold">Create New Wallet</h1>
            <p className="mt-2 text-gray-400">
              Generate a new wallet with a secure mnemonic phrase
            </p>
          </div>

          <Card className="space-y-6">
            {!mnemonic ? (
              <div className="text-center">
                <p className="text-gray-400 mb-4">
                  Click the button below to generate your new wallet
                </p>
                <Button
                  onClick={handleGenerateWallet}
                  isLoading={isLoading}
                >
                  Generate Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Your Mnemonic Phrase
                  </label>
                  <div className="relative">
                    <div className="bg-gray-900/50 p-4 rounded-lg break-all font-mono text-sm">
                      {mnemonic}
                    </div>
                    <button
                      onClick={handleCopyMnemonic}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h3 className="text-yellow-500 font-medium mb-2">Important Security Notice</h3>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li>• Write down your mnemonic phrase and store it securely</li>
                    <li>• Never share your mnemonic phrase with anyone</li>
                    <li>• Lost mnemonic phrases cannot be recovered</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    variant="secondary"
                    onClick={() => setMnemonic('')}
                  >
                    Generate New
                  </Button>
                  <Button onClick={handleProceed}>
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
} 