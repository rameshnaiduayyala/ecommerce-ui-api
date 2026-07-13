import { useEffect } from 'react';

/**
 * Custom hook to dynamically set the document title (browser tab name)
 * @param {string} title - The title to display
 * @param {boolean} [includeBrandSuffix=true] - Whether to append ' | Aha Konaseema' to the title
 */
const useDocumentTitle = (title, includeBrandSuffix = true) => {
  useEffect(() => {
    let formattedTitle = 'Aha Konaseema';
    
    if (title) {
      formattedTitle = includeBrandSuffix ? `${title} | Aha Konaseema` : title;
    }
    
    document.title = formattedTitle;
  }, [title, includeBrandSuffix]);
};

export default useDocumentTitle;
