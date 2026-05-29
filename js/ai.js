// AI Assistant Logic
document.addEventListener('DOMContentLoaded', () => {
  const aiChatBtn = document.getElementById('aiChatBtn');
  const aiChatWidget = document.getElementById('aiChatWidget');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');

  if (!aiChatBtn || !aiChatWidget) return;

  // Toggle chat widget
  aiChatBtn.addEventListener('click', () => {
    aiChatWidget.classList.toggle('d-none');
    if (!aiChatWidget.classList.contains('d-none')) {
      chatInput.focus();
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });

  closeChatBtn.addEventListener('click', () => {
    aiChatWidget.classList.add('d-none');
  });

  // Handle form submission
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to UI
    appendMessage('user', message);
    chatInput.value = '';

    // Show typing indicator
    const typingIndicator = appendTypingIndicator();

    try {
      // Call API
      const response = await ApiService.sendChatMessage(message);
      
      // Remove typing indicator
      typingIndicator.remove();
      
      // Add AI response to UI
      appendMessage('ai', response.reply);
    } catch (error) {
      // Remove typing indicator
      typingIndicator.remove();
      
      // Add error message
      appendMessage('ai', 'Sorry, I encountered an error. Make sure your GEMINI_API_KEY is configured in the backend .env file.', true);
    }
  });

  function appendMessage(sender, text, isError = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}-message ${isError ? 'text-danger' : ''}`;
    
    // Format text: basic markdown to HTML for bold and line breaks
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    msgDiv.innerHTML = `
      <div class="message-content">
        ${formattedText}
      </div>
    `;
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = `chat-message ai-message typing-indicator`;
    typingDiv.innerHTML = `
      <div class="message-content">
        <span></span><span></span><span></span>
      </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
  }
});
