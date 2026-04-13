let isSubmitting = false;

const addressData = {
  "Beijing": { "Beijing": ["Dongcheng", "Xicheng", "Chaoyang", "Haidian", "Fengtai"] },
  "Shanghai": { "Shanghai": ["Huangpu", "Xuhui", "Changning", "Jing'an", "Putuo"] },
  "Guangdong": { 
    "Guangzhou": ["Tianhe", "Yuexiu", "Haizhu", "Liwan", "Baiyun"],
    "Shenzhen": ["Nanshan", "Futian", "Luohu", "Bao'an", "Longgang"]
  },
  "Hong Kong": { "Hong Kong": ["Central and Western", "Wan Chai", "Eastern District", "Southern District", "Yau Tsim Mong"] },
  "Macau": { "Macau": ["Fátima, St. Anthony, Cathedral, Our Lady of Mount"] }
};

function initData() {
  if (!localStorage.getItem('lostFoundData')) {
    const initData = {
      users: [],
      posts: [],
      messages: []
    };
    // Add default admin account
    initData.users.push({ username: 'admin', password: 'admin' });
    localStorage.setItem('lostFoundData', JSON.stringify(initData));
  }
}

function readData() {
  try {
    const rawData = localStorage.getItem('lostFoundData');
    if (!rawData) return { users: [], posts: [], messages: [] };
    const data = JSON.parse(rawData);
    return {
      users: Array.isArray(data.users) ? data.users : [],
      posts: Array.isArray(data.posts) ? data.posts : [],
      messages: Array.isArray(data.messages) ? data.messages : []
    };
  } catch (e) {
    console.error('Failed to read data, using default empty data:', e);
    initData();
    return { users: [], posts: [], messages: [] };
  }
}

function writeData(data) {
  try {
    const validData = {
      users: Array.isArray(data.users) ? data.users : [],
      posts: Array.isArray(data.posts) ? data.posts : [],
      messages: Array.isArray(data.messages) ? data.messages : []
    };
    localStorage.setItem('lostFoundData', JSON.stringify(validData));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      alert('Not enough space! Please clean some history messages');
    } else {
      alert('Storage failed: ' + e.message);
    }
    return false;
  }
}

function clearStorage() {
  if (confirm('Clear all storage data (users, posts, messages)?')) {
    localStorage.clear();
    location.reload();
  }
}

function $(id) { return document.getElementById(id); }

function initAddress() {
  const provinceSel = $("province");
  const citySel = $("city");
  const areaSel = $("area");
  
  provinceSel.innerHTML = "";
  citySel.innerHTML = "";
  areaSel.innerHTML = "";
  
  for (const province in addressData) {
    const option = document.createElement("option");
    option.value = province;
    option.textContent = province;
    provinceSel.appendChild(option);
  }
  
  provinceSel.onchange = function() {
    loadCity();
    loadArea();
  };
  
  citySel.onchange = function() {
    loadArea();
  };
  
  loadCity();
  loadArea();
}

function loadCity() {
  const province = $("province").value;
  const citySel = $("city");
  citySel.innerHTML = "";
  
  if (!addressData[province]) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No cities yet";
    citySel.appendChild(option);
    return;
  }
  
  const cities = addressData[province];
  for (const city in cities) {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySel.appendChild(option);
  }
}

function loadArea() {
  const province = $("province").value;
  const city = $("city").value;
  const areaSel = $("area");
  areaSel.innerHTML = "";
  
  if (!addressData[province] || !addressData[province][city]) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No district or county yet!";
    areaSel.appendChild(option);
    return;
  }
  
  const areas = addressData[province][city];
  areas.forEach(area => {
    const option = document.createElement("option");
    option.value = area;
    option.textContent = area;
    areaSel.appendChild(option);
  });
}

function initInteractiveBlur() {
  // Kept empty to avoid errors
}

function initSearchInteraction() {
  const searchInput = $('searchInput');
  const filterGroup = $('filterGroup');
  
  searchInput.addEventListener('click', (e) => {
    e.stopPropagation();
    filterGroup.classList.add('expanded');
  });
  
  document.addEventListener('click', (e) => {
    if (filterGroup.classList.contains('expanded') && 
        !e.target.closest('.search-wrapper') && 
        !e.target.closest('#filterGroup')) {
      filterGroup.classList.remove('expanded');
    }
  });
  
  filterGroup.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
}

function performSearch() {
  const keyword = $('searchInput').value.trim().toLowerCase();
  const sizeVal = $('sizeFilter').value;
  const typeVal = $('typeFilter').value;
  const postTypeVal = $('postTypeFilter').value;
  const weightMin = parseFloat($('weightMin').value) || 0;
  const weightMax = parseFloat($('weightMax').value) || Infinity;
  
  const selectedColors = [];
  document.querySelectorAll('.filter-group .color-option input:checked').forEach(checkbox => {
    selectedColors.push(checkbox.value);
  });
  
  const data = readData();
  const filteredPosts = data.posts.filter(post => {
    if (post.status !== 'active') return false;
    
    let matchKeyword = true;
    if (keyword) {
      const searchText = `${post.title} ${post.desc} ${post.tags.join(' ')} ${post.size} ${post.colors.join(' ')} ${post.category} ${post.weight}`.toLowerCase();
      matchKeyword = searchText.includes(keyword);
    }
    
    let matchSize = true;
    if (sizeVal) {
      matchSize = post.size === sizeVal;
    }
    
    let matchCategory = true;
    if (typeVal) {
      matchCategory = post.category === typeVal;
    }
    
    let matchPostType = true;
    if (postTypeVal) {
      matchPostType = post.type === postTypeVal;
    }
    
    let matchWeight = true;
    if ($('weightMin').value || $('weightMax').value) {
      matchWeight = post.weight >= weightMin && post.weight <= weightMax;
    }
    
    let matchColor = true;
    if (selectedColors.length > 0) {
      matchColor = selectedColors.some(color => post.colors.includes(color));
    }
    
    return matchKeyword && matchSize && matchCategory && matchPostType && matchWeight && matchColor;
  });
  
  $('mainPage').classList.add('hidden');
  $('searchResultPage').classList.remove('hidden');
  $('searchResultPage').classList.add('active');
  
  renderSearchResults(filteredPosts);
}

function renderSearchResults(posts) {
  const resultList = $('searchResultList');
  resultList.innerHTML = '';
  
  if (posts.length === 0) {
    resultList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666; font-size: 16px;">No items satisfying conditions yet</div>`;
    return;
  }
  
  posts.forEach(post => {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    
    const colorTags = post.colors && post.colors.length > 0 
      ? post.colors.map(color => `<span class="tag">${color}</span>`).join('') 
      : '';
    
    postCard.innerHTML = `
      <img src="${post.imgUrl || 'https://via.placeholder.com/320x200?text=No+Image'}" class="post-img" alt="${post.title}">
      <div class="post-body">
        <h4 class="post-title">${post.title}</h4>
        <p class="post-desc">${post.desc}</p>
        <div style="margin-bottom: 10px;">
          ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          ${colorTags}
          <span class="tag">${post.size}</span>
          <span class="tag">${post.weight}kg</span>
          <span class="tag">${post.category}</span>
        </div>
        <div class="post-info">
          <div>📍 ${post.address.province} ${post.address.city} ${post.address.area}</div>
          <div>🕒 ${post.createTime}</div>
        </div>
        <button class="btn btn-primary" style="width: 100%; margin-top: 15px;" onclick="showDetail(${post.id})">Check details</button>
      </div>
    `;
    
    resultList.appendChild(postCard);
  });
}

function backToMain() {
  $('searchResultPage').classList.add('hidden');
  $('searchResultPage').classList.remove('active');
  $('mainPage').classList.remove('hidden');
}

function resetFilter() {
  $('searchInput').value = '';
  $('sizeFilter').value = '';
  $('typeFilter').value = '';
  $('postTypeFilter').value = '';
  $('weightMin').value = '';
  $('weightMax').value = '';
  
  document.querySelectorAll('.filter-group .color-option input:checked').forEach(checkbox => {
    checkbox.checked = false;
  });
}

function showLogin() {
  $('loginPage').classList.remove('hidden');
  $('regPage').classList.add('hidden');
  $('mainPage').classList.add('hidden');
}

function showReg() {
  $('loginPage').classList.add('hidden');
  $('regPage').classList.remove('hidden');
  $('mainPage').classList.add('hidden');
}

function reg() {
  const username = $('regUser').value.trim();
  const password = $('regPwd').value.trim();
  
  if (!username || !password) {
    alert('Please input username and password!');
    return;
  }
  
  const data = readData();
  const userExists = data.users.some(user => user.username === username);
  if (userExists) {
    alert('Username already exists! Please use another one!');
    return;
  }
  
  data.users.push({ username, password });
  writeData(data);
  
  alert('Successfully signed up! Now you can login!');
  showLogin();
  $('regUser').value = '';
  $('regPwd').value = '';
}

function login() {
  const username = $('loginUser').value.trim();
  const password = $('loginPwd').value.trim();
  
  if (!username || !password) {
    alert('Please input username and password');
    return;
  }
  
  const data = readData();
  const user = data.users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    alert('Username or password wrong!');
    return;
  }
  
  localStorage.setItem('currentUser', username);
  
  const isAdmin = (username === 'admin');
  
  $('userInfo').innerHTML = `
    <span style="margin-right: 15px; font-weight: 500; color: white;">Welcome: ${username}</span>
    <button class="btn btn-default" onclick="logout()">Logout</button>
  `;
  
  if (isAdmin) {
    $('adminBtn').style.display = 'inline-block';
  } else {
    $('adminBtn').style.display = 'none';
  }
  
  $('loginPage').classList.add('hidden');
  $('regPage').classList.add('hidden');
  $('mainPage').classList.remove('hidden');
  
  loadPosts();
}

function logout() {
  localStorage.removeItem('currentUser');
  location.reload();
}

function openPost(type) {
  $('postType').value = type;
  $('postModalTitle').textContent = type === 'lost' ? 'Upload lost items' : 'Upload found items';
  $('postOverlay').classList.remove('hidden');
  $('postModal').classList.remove('hidden');
  
  const submitBtn = $('submitPostBtn');
  submitBtn.innerHTML = 'SEND';
  submitBtn.disabled = false;
  isSubmitting = false;
  
  initAddress();
  
  $('postTitle').value = '';
  $('postDesc').value = '';
  $('postSize').value = 'Tiny';
  $('postWeight').value = '';
  $('postCategory').value = 'Other';
  
  document.querySelectorAll('#postModal .color-option input').forEach(checkbox => {
    checkbox.checked = false;
  });
  $('postImg').value = '';
  $('postTags').value = '';
  $('detailAddr').value = '';
}

function closePost() {
  $('postOverlay').classList.add('hidden');
  $('postModal').classList.add('hidden');
}

async function submitPost() {
  if (isSubmitting) return;
  isSubmitting = true;
  
  const submitBtn = $('submitPostBtn');
  submitBtn.innerHTML = '<span class="loading-spinner"></span>SENDING...';
  submitBtn.disabled = true;
  
  const type = $('postType').value;
  const title = $('postTitle').value.trim();
  const desc = $('postDesc').value.trim();
  const size = $('postSize').value;
  const weight = parseFloat($('postWeight').value) || 0;
  const category = $('postCategory').value;
  
  const colors = [];
  document.querySelectorAll('#postModal .color-option input:checked').forEach(checkbox => {
    colors.push(checkbox.value);
  });
  const tags = $('postTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
  const province = $("province").value;
  const city = $("city").value;
  const area = $("area").value;
  const detailAddr = $('detailAddr').value.trim();
  const username = localStorage.getItem('currentUser');
  
  if (!title || !desc || !detailAddr) {
    alert('Title, Description, and detailed address cannot be empty!');
    submitBtn.innerHTML = 'SEND';
    submitBtn.disabled = false;
    isSubmitting = false;
    return;
  }
  
  let imgUrl = '';
  const file = $('postImg').files[0];
  if (file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    await new Promise(resolve => {
      reader.onload = function () {
        imgUrl = reader.result;
        resolve();
      };
    });
  }
  
  setTimeout(() => {
    const data = readData();
    
    const newPost = {
      id: Date.now(),
      type,
      title,
      desc,
      size,
      weight,
      colors,
      category,
      imgUrl,
      tags,
      address: {
        province,
        city,
        area,
        detail: detailAddr
      },
      author: username,
      status: 'active',
      auditStatus: "pending",
      rejectReason: "",
      comments: [],
      createTime: new Date().toLocaleString()
    };
    
    data.posts.push(newPost);
    if (writeData(data)) {
      closePost();
      loadPosts();
      alert('Success! Your post is pending approval.');
    } else {
      alert('Failure! Try again!');
    }
    
    submitBtn.innerHTML = 'SEND';
    submitBtn.disabled = false;
    isSubmitting = false;
    
  }, 1000);
}

function loadPosts() {
  const data = readData();
  const lostList = $('lostList');
  const foundList = $('foundList');
  
  lostList.innerHTML = '';
  foundList.innerHTML = '';
  
  const activePosts = [];
  for (let i = 0; i < data.posts.length; i++) {
    const post = data.posts[i];
    const audit = post.auditStatus || 'approved'; // Compatible with old posts
    if (audit === 'approved' && post.status === "active") {
      activePosts.push(post);
    }
  }
  
  activePosts.forEach(post => {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    
    const colorTags = post.colors && post.colors.length > 0 
      ? post.colors.map(color => `<span class="tag">${color}</span>`).join('') 
      : '';
    
    postCard.innerHTML = `
      <img src="${post.imgUrl || 'https://via.placeholder.com/320x200?text=No+Image'}" class="post-img" alt="${post.title}">
      <div class="post-body">
        <h4 class="post-title">${post.title}</h4>
        <p class="post-desc">${post.desc}</p>
        <div style="margin-bottom: 10px;">
          ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          ${colorTags}
          <span class="tag">${post.size}</span>
          <span class="tag">${post.weight}kg</span>
          <span class="tag">${post.category}</span>
        </div>
        <div class="post-info">
          <div>📍 ${post.address.province} ${post.address.city} ${post.address.area}</div>
          <div>🕒 ${post.createTime}</div>
        </div>
        <button class="btn btn-primary" style="width: 100%; margin-top: 15px;" onclick="showDetail(${post.id})">Check details</button>
      </div>
    `;
    
    if (post.type === 'lost') {
      lostList.appendChild(postCard);
    } else {
      foundList.appendChild(postCard);
    }
  });
  
  if (lostList.innerHTML === '' && foundList.innerHTML === '') {
    const emptyHtml = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666; font-size: 16px;">No items yet! Post your first one!</div>`;
    lostList.innerHTML = emptyHtml;
    foundList.innerHTML = '';
  } else if (lostList.innerHTML === '') {
    lostList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666; font-size: 16px;">No lost items yet!</div>`;
  } else if (foundList.innerHTML === '') {
    foundList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666; font-size: 16px;">No found items yet!</div>`;
  }
}

function showDetail(postId) {
  const data = readData();
  const post = data.posts.find(p => p.id === postId);
  
  if (!post) {
    alert('Post does not exist!');
    return;
  }
  
  const currentUser = localStorage.getItem('currentUser');
  const isAdmin = (currentUser === 'admin');
  
  let auditBadge = '';
  const auditStatus = post.auditStatus || 'approved';
  if (auditStatus === 'pending') auditBadge = '<span class="audit-badge audit-pending">Pending</span>';
  else if (auditStatus === 'approved') auditBadge = '<span class="audit-badge audit-approved">Approved</span>';
  else if (auditStatus === 'rejected') auditBadge = '<span class="audit-badge audit-rejected">Rejected</span>';
  
  let rejectInfo = '';
  if (auditStatus === 'rejected' && (post.author === currentUser || isAdmin)) {
    rejectInfo = `<div style="margin: 10px 0; padding: 10px; background: #f8d7da; border-radius: 6px;">
                    <strong>❌ Rejection reason: </strong> ${post.rejectReason || 'No reason provided'}
                  </div>`;
  }
  
  const detailContent = $('detailContent');
  
  const colorTags = post.colors && post.colors.length > 0 
    ? post.colors.map(color => `<span class="tag">${color}</span>`).join('') 
    : 'None';
  
  detailContent.innerHTML = `
    <h3 style="margin-bottom: 20px; color: #333;">${post.type === 'lost' ? 'Lost items' : 'Found items'}: ${post.title} ${auditBadge}</h3>
    <div style="margin-bottom: 20px;">
      <img src="${post.imgUrl || 'https://via.placeholder.com/800x450?text=No+Image'}" style="width: 100%; max-height: 450px; object-fit: cover; border-radius: 15px;" alt="${post.title}">
    </div>
    <div style="margin: 15px 0; line-height: 1.6;">
      <strong style="color: #333;">Description: </strong>
      <p style="margin-top: 8px; color: #666;">${post.desc}</p>
    </div>
    <div style="margin: 15px 0; padding: 15px; background: rgba(232, 240, 254, 0.15); border-radius: 12px;">
      <strong style="color: #333;">Item attributes: </strong><br>
      <div style="margin-top: 8px; color: #666;">
        Size: ${post.size} | Weight: ${post.weight}kg | Category: ${post.category} | Colors: ${colorTags}
      </div>
    </div>
    <div style="margin: 15px 0;">
      <strong style="color: #333;">Tags: </strong>
      ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
    </div>
    <div style="margin: 15px 0; line-height: 1.6;">
      <strong style="color: #333;">Lost/Found address: </strong>
      <p style="margin-top: 8px; color: #666;">${post.address.province} ${post.address.city} ${post.address.area} ${post.address.detail}</p>
    </div>
    <div style="margin: 15px 0;">
      <strong style="color: #333;">Sender: </strong> <span style="color: #666;">${post.author}</span>
    </div>
    <div style="margin: 15px 0;">
      <strong style="color: #333;">Post time: </strong> <span style="color: #666;">${post.createTime}</span>
    </div>
    ${rejectInfo}
    
    <div style="margin: 30px 0; display: flex; gap: 15px; flex-wrap: wrap;">
      <button class="btn btn-primary" onclick="openChatWith('${post.author}')">💌 Contact sender</button>
      ${currentUser === post.author ? `<button class="btn btn-success" onclick="markRecovered(${post.id})">✅ Mark as found</button>` : ''}
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
      <h4 style="color: #333; margin-bottom: 20px;">Comments (${post.comments.length})</h4>
      <div id="commentList">
        ${post.comments.length === 0 ? "<div style='color: #666; margin: 20px 0; font-size: 14px;'>No comments yet! Be the first!</div>" : ''}
        ${post.comments.map(comment => `
          <div class="comment">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: #333;">${comment.author}</strong>
              <span style="color: #666; font-size: 12px;">${comment.time}</span>
            </div>
            <p style="color: #666; line-height: 1.5;">${comment.content}</p>
          </div>
        `).join('')}
      </div>
      
      <div style="margin-top: 25px;">
        <textarea id="commentInput_${postId}" placeholder="Input your comment..." style="width: 100%; margin-bottom: 15px; min-height: 100px;"></textarea>
        <button class="btn btn-primary" onclick="addComment(${postId})">Post comment</button>
      </div>
    </div>
  `;
  
  $('detailOverlay').classList.remove('hidden');
  $('detailModal').classList.remove('hidden');
}

function closeDetail() {
  $('detailOverlay').classList.add('hidden');
  $('detailModal').classList.add('hidden');
}

function addComment(postId) {
  const currentUser = localStorage.getItem('currentUser');
  const commentInput = $(`commentInput_${postId}`);
  const content = commentInput.value.trim();
  
  if (!content) {
    alert('Comment cannot be empty!');
    return;
  }
  
  const data = readData();
  const postIndex = data.posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) {
    alert('Post does not exist!');
    return;
  }
  
  data.posts[postIndex].comments.push({
    author: currentUser,
    content,
    time: new Date().toLocaleString()
  });
  
  writeData(data);
  commentInput.value = '';
  showDetail(postId);
}

function markRecovered(postId) {
  const data = readData();
  const postIndex = data.posts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) {
    alert('Post does not exist!');
    return;
  }
  
  data.posts[postIndex].status = 'recovered';
  writeData(data);
  
  closeDetail();
  loadPosts();
  alert('Marked as found! This post will no longer appear on the main page.');
}

function openMsg() {
  const currentUser = localStorage.getItem('currentUser');
  const data = readData();
  
  const messages = data.messages.filter(msg => 
    msg.from === currentUser || msg.to === currentUser
  );
  
  const chatUsers = new Set();
  messages.forEach(msg => {
    if (msg.from !== currentUser) chatUsers.add(msg.from);
    if (msg.to !== currentUser) chatUsers.add(msg.to);
  });
  
  const chatList = $('chatList');
  chatList.innerHTML = '';
  
  Array.from(chatUsers).forEach(user => {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.textContent = user;
    chatItem.onclick = () => {
      document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
      });
      chatItem.classList.add('active');
      $('currentChatUser').value = user;
      loadChatMessages(user);
    };
    chatList.appendChild(chatItem);
  });
  
  if (chatList.innerHTML === '') {
    chatList.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No conversations yet</div>';
  } else {
    chatList.firstChild.click();
  }
  
  $('msgOverlay').classList.remove('hidden');
  $('msgModal').classList.remove('hidden');
}

function closeMsg() {
  $('msgOverlay').classList.add('hidden');
  $('msgModal').classList.add('hidden');
}

function loadChatMessages(targetUser) {
  const currentUser = localStorage.getItem('currentUser');
  const data = readData();
  
  const messages = data.messages.filter(msg => 
    (msg.from === currentUser && msg.to === targetUser) || 
    (msg.from === targetUser && msg.to === currentUser)
  ).sort((a, b) => new Date(a.time) - new Date(b.time));
  
  const chatMessages = $('chatMessages');
  chatMessages.innerHTML = '';
  
  messages.forEach(msg => {
    const isMine = msg.from === currentUser;
    const msgItem = document.createElement('div');
    msgItem.className = `msg-item ${isMine ? 'msg-mine' : 'msg-other'}`;
    
    let msgContent = '';
    if (msg.imgUrl) {
      msgContent = `<img src="${msg.imgUrl}" style="max-width: 100%; border-radius: 10px; height: auto; max-height: 300px;" alt="Chat Image">`;
    } else {
      msgContent = msg.content;
    }
    
    msgItem.innerHTML = `
      <div class="msg-content">${msgContent}</div>
      <div class="msg-time">${msg.time}</div>
    `;
    
    chatMessages.appendChild(msgItem);
  });
  
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function previewChatImg() {
  const file = $('chatImg').files[0];
  if (file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function() {
      $('tempChatImgUrl').value = reader.result;
      $('imgPreview').innerHTML = `<img src="${reader.result}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;">`;
    };
  }
}

function sendChatMsg() {
  const currentUser = localStorage.getItem('currentUser');
  const targetUser = $('currentChatUser').value;
  const msgInput = $('msgInput');
  const content = msgInput.value.trim();
  const imgUrl = $('tempChatImgUrl').value;

  if (!targetUser) {
    alert('Choose someone to contact first!');
    return;
  }

  if (!content && !imgUrl) {
    alert('Message cannot be empty!');
    return;
  }

  const data = readData();

  const newMsg = {
    from: currentUser,
    to: targetUser,
    content: content || '',
    imgUrl: imgUrl || '',
    time: new Date().toLocaleString()
  };

  data.messages.push(newMsg);
  writeData(data);

  msgInput.value = '';
  $('tempChatImgUrl').value = '';
  $('imgPreview').innerHTML = '';
  $('chatImg').value = '';
  
  loadChatMessages(targetUser);
  setTimeout(() => {
    const chatMessages = $('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 100);
}

function openChatWith(targetUser) {
  $('currentChatUser').value = targetUser;
  openMsg();
  
  setTimeout(() => {
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
      if (item.textContent === targetUser) {
        item.click();
      }
    });
  }, 100);
}

// ==================== My Posts (Pending) ====================
function openMyPosts() {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) { alert("Please login first!"); return; }
  const data = readData();
  const myPosts = [];
  for (let i = 0; i < data.posts.length; i++) {
    if (data.posts[i].author === currentUser) {
      myPosts.push(data.posts[i]);
    }
  }
  myPosts.sort((a,b) => b.id - a.id);
  const listDiv = $("myPostsList");
  listDiv.innerHTML = "";
  if (myPosts.length === 0) {
    listDiv.innerHTML = '<div style="text-align:center; padding:50px; color:#999;">You haven\'t posted anything yet.</div>';
  } else {
    let html = "";
    for (let i = 0; i < myPosts.length; i++) {
      const post = myPosts[i];
      const auditStatus = post.auditStatus || 'approved';
      let auditClass = "", auditText = "";
      if (auditStatus === 'pending') { auditClass = 'audit-pending'; auditText = 'Pending'; }
      else if (auditStatus === 'approved') { auditClass = 'audit-approved'; auditText = 'Approved'; }
      else { auditClass = 'audit-rejected'; auditText = 'Rejected'; }
      let rejectHtml = "";
      if (auditStatus === 'rejected' && post.rejectReason) {
        rejectHtml = `<div style="color:#721c24; background:#f8d7da; padding:5px; border-radius:4px; margin-top:5px;">❌ Rejection reason: ${post.rejectReason}</div>`;
      }
      html += `
        <div class="card" style="padding:15px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between;">
            <strong>${post.title}</strong>
            <span class="audit-badge ${auditClass}">${auditText}</span>
          </div>
          <div style="margin:8px 0;">${post.desc.substring(0,60)}${post.desc.length>60?'...':''}</div>
          <div>Posted: ${post.createTime}</div>
          ${rejectHtml}
          <button class="btn btn-primary" style="margin-top:10px;" onclick="showDetail(${post.id}); closeMyPosts();">Check details</button>
        </div>
      `;
    }
    listDiv.innerHTML = html;
  }
  $("myPostsOverlay").classList.remove("hidden");
  $("myPostsModal").classList.remove("hidden");
}

function closeMyPosts() {
  $("myPostsOverlay").classList.add("hidden");
  $("myPostsModal").classList.add("hidden");
}

// ==================== Admin Panel (Pending) ====================
function openAdminPanel() {
  loadAdminPosts('pending');
  $("adminOverlay").classList.remove("hidden");
  $("adminModal").classList.remove("hidden");
}

function closeAdminPanel() {
  $("adminOverlay").classList.add("hidden");
  $("adminModal").classList.add("hidden");
}

function loadAdminPosts(filter) {
  const data = readData();
  let posts = data.posts.slice();
  posts.sort((a,b) => b.id - a.id);
  if (filter !== 'all') {
    posts = posts.filter(p => (p.auditStatus || 'approved') === filter);
  }
  const listDiv = $("adminPostList");
  listDiv.innerHTML = "";
  if (posts.length === 0) {
    listDiv.innerHTML = '<div style="text-align:center; padding:50px; color:#999;">No posts yet</div>';
    return;
  }
  let html = "";
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const auditStatus = post.auditStatus || 'approved';
    let auditClass = "", auditText = "";
    if (auditStatus === 'pending') { auditClass = 'audit-pending'; auditText = 'Pending'; }
    else if (auditStatus === 'approved') { auditClass = 'audit-approved'; auditText = 'Approved'; }
    else { auditClass = 'audit-rejected'; auditText = 'Rejected'; }
    const rejectReason = post.rejectReason ? `<div><strong>Rejection reason:</strong> ${post.rejectReason}</div>` : '';
    const approveBtn = `<button class="btn btn-success" onclick="auditPost(${post.id}, 'approved')" ${auditStatus==='approved'?'disabled':''}>✅ Approve</button>`;
    const rejectBtn = `<button class="btn btn-danger" onclick="promptReject(${post.id})" ${auditStatus==='rejected'?'disabled':''}>❌ Reject</button>`;
    html += `
      <div class="card" style="padding:15px; margin-bottom:15px;">
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap;">
          <h4 style="margin:0;">${post.title} <span class="audit-badge ${auditClass}">${auditText}</span></h4>
          <div><small>${post.createTime}</small></div>
        </div>
        <div style="margin:8px 0;">Sender: ${post.author} | Type: ${post.type==='lost'?'Lost':'Found'}</div>
        <div>${post.desc.substring(0,100)}${post.desc.length>100?'...':''}</div>
        ${rejectReason}
        <div style="margin-top:10px; display:flex; gap:8px;">
          ${approveBtn}
          ${rejectBtn}
          <button class="btn btn-primary" onclick="showDetail(${post.id}); closeAdminPanel();">View details</button>
        </div>
      </div>
    `;
  }
  listDiv.innerHTML = html;
}

function promptReject(postId) {
  const reason = prompt("Please enter reason for rejection:");
  if (reason === null) return;
  if (reason.trim() === "") { alert("Rejection reason cannot be empty!"); return; }
  auditPost(postId, 'rejected', reason.trim());
}

function auditPost(postId, status, reason) {
  const data = readData();
  const postIndex = data.posts.findIndex(p => p.id === postId);
  if (postIndex === -1) { alert("Post does not exist!"); return; }
  data.posts[postIndex].auditStatus = status;
  if (status === 'rejected') {
    data.posts[postIndex].rejectReason = reason;
  } else {
    data.posts[postIndex].rejectReason = '';
  }
  writeData(data);
  loadAdminPosts('pending');
  loadPosts();
}

// ==================== Page Initialization ====================
window.onload = function() {
  initData();
  initInteractiveBlur();
  initSearchInteraction();
  
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    const data = readData();
    const user = data.users.find(u => u.username === currentUser);
    if (user) {
      $('userInfo').innerHTML = `
        <span style="margin-right: 15px; font-weight: 500; color: white;">Welcome: ${currentUser}</span>
        <button class="btn btn-default" onclick="logout()">Logout</button>
      `;
      if (currentUser === 'admin') $('adminBtn').style.display = 'inline-block';
      $('loginPage').classList.add('hidden');
      $('regPage').classList.add('hidden');
      $('mainPage').classList.remove('hidden');
      loadPosts();
    } else {
      localStorage.removeItem('currentUser');
      showLogin();
    }
  } else {
    showLogin();
  }
};