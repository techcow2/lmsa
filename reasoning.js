// Function to format reasoning output
function formatReasoning(content) {
    // Extract the content between <think> tags
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    if (!thinkMatch) return content;

    const thinkContent = thinkMatch[1].trim();
    
    // Create the reasoning container
    const reasoningHtml = `
        <div class="think">
            <div class="reasoning-intro">
                <i class="fas fa-brain"></i>
                Reasoning Process
            </div>
            ${thinkContent.split('\n\n').map(paragraph => {
                // Skip empty paragraphs
                if (!paragraph.trim()) return '';
                return `<div class="reasoning-step">${paragraph.trim()}</div>`;
            }).join('')}
        </div>
    `;

    // Replace the original <think> block with the formatted version
    return content.replace(/<think>[\s\S]*?<\/think>/, reasoningHtml);
}

// Function to format special text elements
function formatSpecialText(content) {
    // Replace color spans with styled spans
    content = content.replace(/<span style="color: #([A-Fa-f0-9]{6})">([^<]+)<\/span>/g, 
        (match, color, text) => `<span style="color: #${color}; font-weight: bold;">${text}</span>`);
    
    // Format mathematical expressions
    content = content.replace(/\\\(([^\)]+)\\\)/g, 
        (match, expr) => `<span class="math-expr">${expr}</span>`);
    
    // Format boxed content
    content = content.replace(/\\boxed\{([^\}]+)\}/g, 
        (match, content) => `<span class="boxed">${content}</span>`);
    
    return content;
}

// Add the styles for special formatting
const style = document.createElement('style');
style.textContent = `
    .math-expr {
        font-family: 'Times New Roman', serif;
        font-style: italic;
        color: #7cb7ff;
    }
    
    .boxed {
        border: 2px solid #7cb7ff;
        padding: 2px 6px;
        border-radius: 4px;
        margin: 0 2px;
        color: #7cb7ff;
        font-weight: bold;
    }
`;
document.head.appendChild(style);

// Export the formatting functions
window.formatReasoning = formatReasoning;
window.formatSpecialText = formatSpecialText;