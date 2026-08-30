import os from "node:os";

export function findPrivateIpv4() {
  const candidates: Array<{ address: string; score: number }> = [];
  for (const [name, interfaces] of Object.entries(os.networkInterfaces())) {
    for (const item of interfaces ?? []) {
      if (item.family !== "IPv4" || item.internal) continue;
      if (!/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(item.address)) continue;
      let score = 0;
      if (/wi-?fi|wlan|wireless|ethernet|^en\d|^eth\d/i.test(name)) score += 100;
      if (/vmware|virtual|vbox|hyper-v|docker|wsl|loopback|vethernet/i.test(name)) score -= 200;
      if (/^192\.168\.(0|1)\./.test(item.address)) score += 10;
      candidates.push({ address: item.address, score });
    }
  }
  return candidates.sort((a, b) => b.score - a.score)[0]?.address ?? "127.0.0.1";
}
