function checkAchievements(score) {
  if (score > 10000) localStorage.setItem('achievement_Eggcellent', 'true');
  if (score > 50000) localStorage.setItem('achievement_Master', 'true');
}