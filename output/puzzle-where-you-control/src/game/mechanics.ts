export class Mechanics {
  // placeholder for desync mechanics
  static phaseShift(echo: any, prime: any) { echo.velX = -prime.velX; }
  static gravityInversion(echo: any) { echo.gravity *= -1; }
  static timeEcho(echo: any) { /* record inputs */ }
  static massSwap(prime: any, echo: any) { 
    // swap friction, jump, etc.
  }
}
