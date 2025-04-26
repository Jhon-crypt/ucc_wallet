import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { ClickableCard } from '../components/Card';

export default function Welcome() {
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className="space-y-8"
        >
          <motion.div variants={item}>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Welcome to UCC Wallet
            </h1>
            <p className="mt-4 text-gray-400">
              Your gateway to the Universe Chain ecosystem. Secure, simple, and powerful.
            </p>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ClickableCard onClick={() => navigate('/create-wallet')} className="text-left">
              <div className="space-y-4">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Create New Wallet</h2>
                  <p className="mt-2 text-gray-400">
                    Generate a new wallet with a secure mnemonic phrase
                  </p>
                </div>
              </div>
            </ClickableCard>

            <ClickableCard onClick={() => navigate('/import-wallet')} className="text-left">
              <div className="space-y-4">
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Import Existing Wallet</h2>
                  <p className="mt-2 text-gray-400">
                    Import your wallet using private key or mnemonic phrase
                  </p>
                </div>
              </div>
            </ClickableCard>
          </motion.div>

          <motion.div variants={item} className="pt-8">
            <p className="text-gray-400 mb-4">
              New to Universe Chain? Learn more about our ecosystem
            </p>
            <Button
              variant="secondary"
              onClick={() => window.open('https://docs.ucc.xyz', '_blank')}
            >
              View Documentation
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
} 