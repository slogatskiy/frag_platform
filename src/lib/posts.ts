import { prisma } from "@/lib/prisma";
import type { PostCardData } from "@/components/post-card";

const cardInclude = (meId: string | null) => ({
  user: { select: { handle: true, name: true, avatarUrl: true } },
  fragrance: {
    select: {
      slug: true,
      name: true,
      imageUrl: true,
      brand: { select: { name: true } },
    },
  },
  _count: { select: { likes: true } },
  likes: meId
    ? { where: { userId: meId }, select: { id: true } }
    : { where: { userId: "" }, select: { id: true } },
});

type RawPost = {
  id: string;
  createdAt: Date;
  rating: number | null;
  body: string;
  user: { handle: string; name: string | null; avatarUrl: string | null };
  fragrance: {
    slug: string;
    name: string;
    imageUrl: string | null;
    brand: { name: string };
  };
  _count: { likes: number };
  likes: { id: string }[];
};

function toCard(p: RawPost): PostCardData {
  return {
    id: p.id,
    createdAt: p.createdAt,
    rating: p.rating,
    body: p.body,
    user: p.user,
    fragrance: p.fragrance,
    likeCount: p._count.likes,
    likedByMe: p.likes.length > 0,
  };
}

// Лента: посты пользователя и его друзей (свежие сверху).
export async function getFeedPosts(
  meId: string,
  friendIds: string[],
  take = 40
): Promise<PostCardData[]> {
  const posts = await prisma.post.findMany({
    where: { userId: { in: [meId, ...friendIds] } },
    orderBy: { createdAt: "desc" },
    take,
    include: cardInclude(meId),
  });
  return (posts as RawPost[]).map(toCard);
}

// Посты по конкретному аромату (community reviews).
export async function getFragrancePosts(
  fragranceId: string,
  meId: string | null,
  take = 20
): Promise<PostCardData[]> {
  const posts = await prisma.post.findMany({
    where: { fragranceId },
    orderBy: { createdAt: "desc" },
    take,
    include: cardInclude(meId),
  });
  return (posts as RawPost[]).map(toCard);
}

// Один пост для страницы /p/[id].
export async function getPost(
  id: string,
  meId: string | null
): Promise<PostCardData | null> {
  const post = await prisma.post.findUnique({
    where: { id },
    include: cardInclude(meId),
  });
  return post ? toCard(post as RawPost) : null;
}
