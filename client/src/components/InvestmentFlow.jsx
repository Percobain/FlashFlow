import SelfVerification from './SelfVerification';

const InvestmentFlow = ({ userAddress }) => {
    const [isVerified, setIsVerified] = useState(false);
    const [verificationData, setVerificationData] = useState(null);

    const handleVerificationComplete = (data) => {
        setIsVerified(true);
        setVerificationData(data);
    };

    if (!isVerified) {
        return (
            <div className="max-w-md mx-auto mt-8">
                <SelfVerification 
                    userAddress={userAddress}
                    onVerificationComplete={handleVerificationComplete}
                />
            </div>
        );
    }

    return (
        <div>
            {/* Show investment interface */}
            <InvestmentInterface userAddress={userAddress} />
        </div>
    );
};