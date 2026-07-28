# PVE Tools Pro

<div align="center">

Proxmox VE 9.x 向けのワンストップ運用スクリプトです。VM ライフサイクル管理、ホストネットワーク / ファイアウォール / IPv6、GPU / PCI パススルー、日常保守、サードパーティー連携をまとめて扱えます。

[Docs](https://pve.u3u.icu) | [更新履歴](https://pve.u3u.icu/update) | [FAQ](https://pve.u3u.icu/faq) | [中文](./README.md) | [English](./README_EN.md)

</div>

> [!CAUTION]
> **お知らせ：ただ飯に文句をつけるな**
>
> 本项目は完全無料のオープンソースであり、個人の情熱だけで維持されています。Issue を立てる前や質問する前に、ドキュメント、画面上の注意書き、既存の Issue を必ずお読みください。
> 再現手順やログなどの有効な情報がないフィードバックは直接クローズされます。オープンソースはあなたの召使いではありません。敬意は相互のものです。
>
> **お知らせ（2026-07）：Shell 版はメンテナンスを再開しました。v8.8.8 での更新終了と Go 版への移行計画は撤回されています。経緯は[こちら](https://pve.u3u.icu/blog/why-go-version-is-not-updating/)をご覧ください。**

## 概要

PVE Tools Pro は Proxmox VE 9.x 向けの対話型 Bash ツールです。PVE の標準コマンドを置き換えるのではなく、頻繁に使う運用タスクをまとめ、確認ポイントとリスク警告を強化することを目的としています。

主な機能：

- VM ライフサイクル運用：バックアップ、リストア、設定のエクスポート / インポート、テンプレート、クローン、Cloud-Init、ディスク管理、スナップショット、起動順、クラスタ内移行。
- ホストネットワークとファイアウォール：bridge、Bond、VLAN、IPv4 / IPv6 / SLAAC / DHCP、PVE Firewall、Security Group、IPv6 ヘルパー、診断ツール。
- GPU / PCI パススルー：Intel iGPU、NVIDIA、AMD dGPU、AMD iGPU、RDM、NVMe、コントローラーパススルー。
- 日常保守：ミラー切替、システム更新、PVE 8 -> 9 アップグレード、カーネル管理、GRUB バックアップ、メール通知。

## クイックスタート

```bash
bash <(curl -sSL https://pve.u3u.icu/PVE-Tools.sh)
```

## 注意事項

- このスクリプトはホストネットワーク、ファイアウォール、GRUB、カーネルモジュール、VM 設定に実際の変更を加えます。
- バックアップ / リストア、テンプレート / クローン / Cloud-Init、ディスク、スナップショット、移行は高リスク操作です。必ず検証済みバックアップを用意してください。
- ネットワークやファイアウォールの誤設定は SSH / WebUI 切断を引き起こす可能性があります。
- AMD iGPU パススルーではユーザー自身が ROM / vBIOS を準備する必要があります。

## 公式サイト入口

- ドキュメント: https://pve.u3u.icu
- 機能一覧: https://pve.u3u.icu/features
- 更新履歴: https://pve.u3u.icu/update
- FAQ: https://pve.u3u.icu/faq
- ホストネットワーク / ファイアウォール / IPv6 ガイド: https://pve.u3u.icu/advanced/host-network-firewall-ipv6
- VM バックアップ / 移行 / Cloud-Init ガイド: https://pve.u3u.icu/advanced/vm-backup-migration-cloudinit

## Sponsor

プロジェクトの継続的な保守と改善を支援したい場合はこちらです。

- Sponsor ページ: https://pve.u3u.icu/sponsor
- Afdian: https://afdian.com/a/cyrenenight

## Pay For Services

個別のリモートサポート、緊急復旧、パススルー調整、ネットワーク構築、完全な PVE セットアップが必要な場合はこちらを参照してください。

- 有償サポート: https://pve.u3u.icu/pay

## 他の言語

- 中文: [README.md](./README.md)
- English: [README_EN.md](./README_EN.md)

## 免責事項

このプロジェクトは Proxmox VE ホスト / ゲストに対して実際の変更を加える運用ツールです。検証済みバックアップ、メンテナンス時間、ロールバック計画なしで高リスク操作を実行した場合、管理プレーンの喪失、サービス停止、不可逆なデータ破損を招く可能性があります。データ損失、復旧費用、第三者データ復旧費用は実運用者の責任となります。

ULA 全文: https://pve.u3u.icu/ula
このページでは、スクリプトの適用範囲、リスク境界、利用者が負う操作責任、そしてネットワーク断、設定ミス、データ損傷、サービス停止、復旧費用に関する免責内容を案内しています。バックアップ / リストア、移行、Cloud-Init、ディスク変更、GPU パススルー、ホストネットワークやファイアウォール変更の前に確認してください。

## License

GPL-3.0. See [LICENSE](LICENSE).
