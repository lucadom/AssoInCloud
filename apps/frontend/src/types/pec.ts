export interface PecFolder {
  name: string;
  fullName: string;
  messageCount: number;
  unreadCount: number;
}

export interface PecMessageSummary {
  uid: number;
  folder: string;
  from: string;
  subject: string;
  date: string;
  read: boolean;
}

export interface PecAttachment {
  index: number;
  filename: string;
  contentType: string;
  size: number;
}

export interface PecMessage extends PecMessageSummary {
  bodyHtml: string | null;
  bodyText: string | null;
  attachments: PecAttachment[];
  bustaTransporto: boolean;
}
