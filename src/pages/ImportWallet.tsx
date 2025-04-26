import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UCCWallet } from '../utils/UCCWallet';

export default function ImportWallet() {
  const navigate = useNavigate();
  const [importType, setImportType] = useState<'mnemonic' | 'privateKey'>('mnemonic');
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!value.trim()) {
      toast.error('Please enter a valid value');
      return;
    }

    try {
      setIsLoading(true);
      const wallet = new UCCWallet();
      
      if (importType === 'mnemonic') {
        const walletInfo = wallet.importFromMnemonic(value.trim());
        navigate('/dashboard', { state: { walletInfo } });
      } else {
        const walletInfo = wallet.importFromPrivateKey(value.trim());
        navigate('/dashboard', { state: { walletInfo } });
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import wallet');
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
            <h1 className="text-3xl font-bold">Import Wallet</h1>
            <p className="mt-2 text-gray-400">
              Import your existing wallet using mnemonic phrase or private key
            </p>
          </div>

          <Card className="space-y-6">
            <div className="flex space-x-4">
              <Button
                variant={importType === 'mnemonic' ? 'primary' : 'secondary'}
                onClick={() => setImportType('mnemonic')}
              >
                Mnemonic Phrase
              </Button>
              <Button
                variant={importType === 'privateKey' ? 'primary' : 'secondary'}
                onClick={() => setImportType('privateKey')}
              >
                Private Key
              </Button>
            </div>

            <Input
              label={importType === 'mnemonic' ? 'Mnemonic Phrase' : 'Private Key'}
              placeholder={
                importType === 'mnemonic'
                  ? 'Enter your 12 or 24 word mnemonic phrase'
                  : 'Enter your private key'
              }
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="text-yellow-500 font-medium mb-2">Security Notice</h3>
              <p className="text-sm text-gray-400">
                Never share your {importType === 'mnemonic' ? 'mnemonic phrase' : 'private key'} with anyone.
                Make sure you are on the correct website before entering sensitive information.
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                isLoading={isLoading}
              >
                Import Wallet
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
} 