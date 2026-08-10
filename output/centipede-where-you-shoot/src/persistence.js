export class Persistence {
 constructor() {
 this.storageKey = 'centipede_highscore';
 }
 
 getHighScore() {
 try {
 return parseInt(localStorage.getItem(this.storageKey)) || 0;
 } catch (e) {
 return 0;
 }
 }
 
 saveHighScore(score) {
 try {
 const current = this.getHighScore();
 if (score > current) {
 localStorage.setItem(this.storageKey, score.toString());
 return true;
 }
 } catch (e) {
 console.warn('Could not save high score');
 }
 return false;
 }
}