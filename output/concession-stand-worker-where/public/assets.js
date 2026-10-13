export async function loadAssets() {
  const assetList = [
    { name: 'worker', src: 'https://raw.githubusercontent.com/terrariaonline/Asset-Store/master/Characters/Worker.png' },
    { name: 'burger', src: 'https://raw.githubusercontent.com/terrariaonline/Asset-Store/master/Items/Burger.png' },
    { name: 'enemy', src: 'https://raw.githubusercontent.com/terrariaonline/Asset-Store/master/Enemies/Enemy.png' }
  ];

  for (const asset of assetList) {
    try {
      const response = await fetch(asset.src);
      if (!response.ok) throw new Error(`Failed to load ${asset.name}`);
      const blob = await response.blob();
      const img = await createImageBitmap(blob);
      assets[asset.name] = img;
    } catch (e) {
      console.warn(`Using placeholder for ${asset.name}`);
      const canvas = document.createElement('canvas');
      canvas.width = 32; canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = asset.name === 'worker' ? '#00FFE0' : asset.name === 'burger' ? '#FF2E88' : '#FF8800'; 
      ctx.fillRect(0, 0, 32, 32);
      assets[asset.name] = await createImageBitmap(canvas);
    }
  }
}
}