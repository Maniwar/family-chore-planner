const fs = require('fs');
let code = fs.readFileSync('src/components/MemberPinModal.tsx', 'utf8');

code = code.replace(
  'interface MemberPinModalProps {\n  isOpen: boolean;\n  onClose: () => void;\n  onSuccess: () => void;\n  expectedPin: string;\n  memberName: string;\n  currentTheme?: ThemePreset;\n}',
  `interface MemberPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPin?: string) => void;
  expectedPin: string;
  memberName: string;
  currentTheme?: ThemePreset;
  mode?: 'verify' | 'setup';
}`
);

code = code.replace(
  '  memberName,\n  currentTheme = \'rose\',\n}) => {',
  `  memberName,
  currentTheme = 'rose',
  mode = 'verify',
}) => {`
);

// We need state for setup mode steps
code = code.replace(
  '  const [isShaking, setIsShaking] = useState<boolean>(false);\n',
  `  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [firstPin, setFirstPin] = useState<string>('');\n`
);

code = code.replace(
  '      setPin(\'\');\n      setErrorMsg(null);\n    }\n  }, [isOpen]);',
  `      setPin('');
      setErrorMsg(null);
      setSetupStep(1);
      setFirstPin('');
    }
  }, [isOpen]);`
);

// handleDigitPress
const handleDigitRe = /  const handleDigitPress = \(digit: string\) => {[\s\S]*?  };\n/m;

const newHandleDigit = `  const handleDigitPress = (digit: string) => {
    const targetLength = mode === 'setup' ? 4 : expectedPin.length;
    if (pin.length >= targetLength) return;

    soundFX.playPop();
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg(null);

    if (nextPin.length === targetLength) {
      setTimeout(() => {
        if (mode === 'setup') {
          if (setupStep === 1) {
            setFirstPin(nextPin);
            setPin('');
            setSetupStep(2);
            soundFX.playComplete();
          } else {
            if (nextPin === firstPin) {
              soundFX.playComplete();
              onSuccess(nextPin);
              onClose();
            } else {
              soundFX.playPop();
              setErrorMsg('PINs do not match. Try again.');
              setIsShaking(true);
              setTimeout(() => {
                setIsShaking(false);
                setPin('');
                setFirstPin('');
                setSetupStep(1);
              }, 1000);
            }
          }
        } else {
          if (nextPin === expectedPin) {
            soundFX.playComplete();
            onSuccess();
            onClose();
          } else {
            soundFX.playPop();
            setErrorMsg('Incorrect PIN. Please try again.');
            setIsShaking(true);
            setTimeout(() => {
              setIsShaking(false);
              setPin('');
            }, 600);
          }
        }
      }, 150);
    }
  };
`;

code = code.replace(handleDigitRe, newHandleDigit);

// Update title and description text
code = code.replace(
  '<h2 className="font-bold">Enter PIN for {memberName}</h2>',
  `<h2 className="font-bold">{mode === 'setup' ? \`Set PIN for \${memberName}\` : \`Enter PIN for \${memberName}\`}</h2>`
);

code = code.replace(
  '<p className="text-center text-xs text-slate-500 mb-2">\n            Please enter your personal PIN to access your profile.\n          </p>',
  `<p className="text-center text-xs text-slate-500 mb-2">
            {mode === 'setup' 
              ? (setupStep === 1 ? 'Create a 4-digit PIN to secure this profile.' : 'Confirm your 4-digit PIN.')
              : 'Please enter your personal PIN to access your profile.'}
          </p>`
);

// PIN Dots
code = code.replace(
  'Array.from({ length: expectedPin.length })',
  `Array.from({ length: mode === 'setup' ? 4 : expectedPin.length })`
);

fs.writeFileSync('src/components/MemberPinModal.tsx', code);
