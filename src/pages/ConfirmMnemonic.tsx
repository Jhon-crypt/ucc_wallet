import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UCCWallet } from '../utils/UCCWallet';

export default function ConfirmMnemonic() {
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmWords, setConfirmWords] = useState<string[]>(['', '', '']);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [originalMnemonic, setOriginalMnemonic] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const state = location.state as { mnemonic: string } | null;
    if (!state?.mnemonic) {
      navigate('/create-wallet');
      return;
    }

    setOriginalMnemonic(state.mnemonic);
    // Randomly select 3 words to confirm
    const words = state.mnemonic.split(' ');
    const indices: number[] = [];
    while (indices.length < 3) {
      const index = Math.floor(Math.random() * words.length);
      if (!indices.includes(index)) {
        indices.push(index);
      }
    }
    setSelectedIndices(indices.sort((a, b) => a - b));
  }, [location.state, navigate]);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      const words = originalMnemonic.split(' ');
      const isCorrect = selectedIndices.every(
        (index, i) => words[index].toLowerCase() === confirmWords[i].toLowerCase()
      );

      if (isCorrect) {
        // Create wallet from mnemonic
        const wallet = new UCCWallet();
        const walletInfo = wallet.importFromMnemonic(originalMnemonic);
        
        toast.success('Wallet created successfully!');
        navigate('/dashboard', { state: { walletInfo } });
      } else {
        toast.error('Words do not match. Please try again.');
        setConfirmWords(['', '', '']);
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast.error('Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-3xl font-bold">Confirm Your Mnemonic</h1>
            <p className="mt-2 text-gray-400">
              Please enter the following words from your mnemonic phrase to confirm you've saved it
            </p>
          </div>

          <Card className="space-y-6">
            <div className="space-y-4">
              {selectedIndices.map((wordIndex, i) => (
                <Input
                  key={wordIndex}
                  label={`Word #${wordIndex + 1}`}
                  placeholder={`Enter word #${wordIndex + 1}`}
                  value={confirmWords[i]}
                  onChange={(e) => {
                    const newWords = [...confirmWords];
                    newWords[i] = e.target.value;
                    setConfirmWords(newWords);
                  }}
                />
              ))}
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="text-yellow-500 font-medium mb-2">Verification Required</h3>
              <p className="text-sm text-gray-400">
                This step ensures you've properly saved your mnemonic phrase.
                Make sure you have it written down before proceeding.
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/create-wallet')}
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                isLoading={isLoading}
                disabled={confirmWords.some(word => !word.trim())}
              >
                Confirm & Continue
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
} 