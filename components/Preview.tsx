


import React from 'react';
import type { Novel } from '../types.ts';

const Preview: React.FC<{ novel: Novel | undefined }> = ({ novel }) => {

    if (!novel) {
        return <div className="p-8 text-center text-gray-500">Chargement de l'aperçu...</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-900">
             <div 
                className="max-w-4xl mx-auto p-8 md:p-12 lg:p-16"
                style={{ fontFamily: "'EB Garamond', serif", fontSize: '18px' }}
             >
                <h1 className="text-5xl font-bold text-center mb-20 text-gray-900 dark:text-white" style={{ textAlign: 'center' }}>{novel.title}</h1>
                
                {novel.chapters.map((chapter, index) => (
                    <React.Fragment key={chapter.id}>
                        <h2 className="text-3xl font-bold text-center my-12 text-gray-900 dark:text-white" style={{ textAlign: 'center' }}>
                            {chapter.title}
                        </h2>
                        <div 
                            className="leading-relaxed tracking-wide text-gray-800 dark:text-gray-300"
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: chapter.content }} 
                        />
                        {index < novel.chapters.length - 1 && <hr className="my-16 border-gray-200 dark:border-gray-600" />}
                    </React.Fragment>
                ))}

             </div>
        </div>
    );
};

export default Preview;