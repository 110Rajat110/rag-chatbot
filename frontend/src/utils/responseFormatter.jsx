/**
 * Utility functions for formatting AI responses with markdown-like styling
 */

/**
 * Converts markdown-style text to formatted JSX-compatible structure
 * @param {string} text - Raw response text from AI
 * @returns {string} - Formatted text with HTML-like tags for rendering
 */
export const formatResponse = (text) => {
  if (!text) return '';
  
  let formatted = text;
  
  // Convert headers (## and ###) to bold with larger text
  formatted = formatted.replace(/^### (.+)$/gm, '<strong class="text-lg">$1</strong>');
  formatted = formatted.replace(/^## (.+)$/gm, '<strong class="text-xl">$1</strong>');
  
  // Convert bold text (**text**) to bold
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert bullet points (• or *) at start of lines
  formatted = formatted.replace(/^[\*\•] (.+)$/gm, '• $1');
  
  // Convert numbered lists (1., 2., etc.) at start of lines
  formatted = formatted.replace(/^(\d+)\. (.+)$/gm, '$1. $2');
  
  // Convert multiple consecutive bullet points to proper list format
  const lines = formatted.split('\n');
  let inBulletList = false;
  let inNumberedList = false;
  let result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for bullet point
    if (line.startsWith('• ')) {
      if (!inBulletList) {
        result.push('<ul class="list-disc ml-6 space-y-1">');
        inBulletList = true;
      }
      // Close numbered list if we were in one
      if (inNumberedList) {
        result.push('</ol>');
        inNumberedList = false;
      }
      result.push(`<li class="text-gray-700">${line.substring(2)}</li>`);
    }
    // Check for numbered list
    else if (/^\d+\. /.test(line)) {
      if (!inNumberedList) {
        result.push('<ol class="list-decimal ml-6 space-y-1">');
        inNumberedList = true;
      }
      // Close bullet list if we were in one
      if (inBulletList) {
        result.push('</ul>');
        inBulletList = false;
      }
      const content = line.replace(/^\d+\.\s/, '');
      result.push(`<li class="text-gray-700">${content}</li>`);
    }
    // Regular text
    else {
      // Close any open lists
      if (inBulletList) {
        result.push('</ul>');
        inBulletList = false;
      }
      if (inNumberedList) {
        result.push('</ol>');
        inNumberedList = false;
      }
      
      if (line) {
        // Handle inline bold text
        let processedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
        result.push(`<p class="text-gray-700 mb-2">${processedLine}</p>`);
      } else {
        result.push('<br />');
      }
    }
  }
  
  // Close any remaining open lists
  if (inBulletList) result.push('</ul>');
  if (inNumberedList) result.push('</ol>');
  
  return result.join('');
};

/**
 * Parses formatted response and returns structured data for rendering
 * @param {string} text - Raw response text
 * @returns {Array} - Array of content objects with type and content
 */
export const parseResponse = (text) => {
  if (!text) return [];
  
  const lines = text.split('\n');
  const content = [];
  let currentList = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      if (currentList) {
        content.push(currentList);
        currentList = null;
      }
      continue;
    }
    
    // Headers
    if (line.startsWith('## ')) {
      if (currentList) {
        content.push(currentList);
        currentList = null;
      }
      content.push({
        type: 'header',
        level: 2,
        content: line.substring(3).replace(/\*\*(.+?)\*\*/g, '$1')
      });
    }
    else if (line.startsWith('### ')) {
      if (currentList) {
        content.push(currentList);
        currentList = null;
      }
      content.push({
        type: 'header',
        level: 3,
        content: line.substring(4).replace(/\*\*(.+?)\*\*/g, '$1')
      });
    }
    // Bullet points
    else if (line.startsWith('• ') || line.startsWith('* ')) {
      if (!currentList || currentList.type !== 'bullet') {
        if (currentList) content.push(currentList);
        currentList = { type: 'bullet', items: [] };
      }
      currentList.items.push(line.substring(2).replace(/\*\*(.+?)\*\*/g, '$1'));
    }
    // Numbered lists
    else if (/^\d+\. /.test(line)) {
      if (!currentList || currentList.type !== 'numbered') {
        if (currentList) content.push(currentList);
        currentList = { type: 'numbered', items: [] };
      }
      const content = line.replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, '$1');
      currentList.items.push(content);
    }
    // Regular paragraph
    else {
      if (currentList) {
        content.push(currentList);
        currentList = null;
      }
      content.push({
        type: 'paragraph',
        content: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      });
    }
  }
  
  if (currentList) {
    content.push(currentList);
  }
  
  return content;
};

/**
 * Renders structured content as JSX-like structure
 * @param {Array} content - Structured content from parseResponse
 * @returns {Array} - Array of renderable components
 */
export const renderContent = (content) => {
  return content.map((item, index) => {
    const key = `content-${index}`;
    
    switch (item.type) {
      case 'header':
        const HeaderTag = item.level === 2 ? 'h2' : 'h3';
        return (
          <HeaderTag 
            key={key} 
            className={`font-bold text-gray-900 mb-3 ${item.level === 2 ? 'text-xl' : 'text-lg'}`}
          >
            {item.content}
          </HeaderTag>
        );
      
      case 'bullet':
        return (
          <ul key={key} className="list-disc ml-6 mb-3 space-y-1">
            {item.items.map((bullet, bulletIndex) => (
              <li key={bulletIndex} className="text-gray-700">
                <span dangerouslySetInnerHTML={{ __html: bullet }} />
              </li>
            ))}
          </ul>
        );
      
      case 'numbered':
        return (
          <ol key={key} className="list-decimal ml-6 mb-3 space-y-1">
            {item.items.map((numberedItem, numberedIndex) => (
              <li key={numberedIndex} className="text-gray-700">
                <span dangerouslySetInnerHTML={{ __html: numberedItem }} />
              </li>
            ))}
          </ol>
        );
      
      case 'paragraph':
        return (
          <p key={key} className="text-gray-700 mb-2 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: item.content }} />
          </p>
        );
      
      default:
        return null;
    }
  });
};
