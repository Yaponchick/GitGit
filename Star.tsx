import React from 'react';
import './Star.css';

interface StarProps {
    isFilled: boolean;
    onToggle: () => void;
}

const Star: React.FC<StarProps> = ({ isFilled, onToggle }) => {
    return (
        <div
            className="star-button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                onToggle();
            }}
            aria-pressed={isFilled}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggle();
                }
            }}
            
        >
            <svg
                className={`star-icon ${isFilled ? 'filled' : ''}`}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill={isFilled ? "currentColor" : "none"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

export default Star; 


// import React, { useState } from 'react';
// import './Star.css';

// export interface StartProps {
//     isFilled: boolean;
//     onToggle:() => void;
// }


// const Star: React.FC = () => {
//     const [isFilled, setIsFilled] = useState<boolean>(false);

//     return (
//         <div
//             className="star-button"
//             onClick={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
                
//                 setIsFilled((prev) => !prev);
//             }}
//             aria-pressed={isFilled}
//         >
//             <svg
//                 className={`star-icon ${isFilled ? 'filled' : ''}`}
//                 viewBox="0 0 24 24"
//                 xmlns="http://www.w3.org/2000/svg"
//             >
//                 <path
//                     d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"
//                     stroke="currentColor"
//                     strokeWidth="2"
//                     fill="none"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                 />
//             </svg>
//         </div>
//     );
// };

// export default Star;

