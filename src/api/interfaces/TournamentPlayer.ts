import WsResponse from "./WsResponse";

export default interface TournamentPlayer extends WsResponse {
  user_id: number;
  discord_username: string;
}
