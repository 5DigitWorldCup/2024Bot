export default interface WsResponse {
  discord_user_id: string;
  osu_user_id: string;
  osu_username: string;
  osu_flag: string;
  is_organizer: boolean;
  action?: string;
}
