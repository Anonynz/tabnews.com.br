import { DefaultLayout, ContentList } from 'pages/interface/index.js';
import user from 'models/user.js';
import content from 'models/content.js';
import authorization from 'models/authorization.js';
import validator from 'models/validator.js';
import { FaTree } from 'react-icons/fa';

export default function Home({ contentListFound, pagination, beta }) {
  return (
    <>
      <DefaultLayout>
        <ContentList
          contentList={contentListFound}
          pagination={pagination}
          paginationBasePath="/relevantes_beta/1/pagina"
          revalidatePath={`/relevantes_beta/${beta}/pagina`}
          emptyStateProps={{
            title: 'Nenhum conteúdo encontrado',
            description: 'Quando eu cheguei era tudo mato...',
            icon: FaTree,
          }}
        />
      </DefaultLayout>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: [{ params: { beta: '1' } }, { params: { beta: '2' } }],
    fallback: 'blocking',
  };
}

export async function getStaticProps(context) {
  const userTryingToGet = user.createAnonymous();
  const beta = context.params.beta;

  context.params = context.params ? context.params : {};

  try {
    context.params = validator(context.params, {
      page: 'optional',
      per_page: 'optional',
    });
  } catch (error) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  const results = await content.findWithStrategy({
    strategy: 'relevant',
    beta,
    where: {
      parent_id: null,
      status: 'published',
    },
    attributes: {
      exclude: ['body'],
    },
    page: context.params.page,
    per_page: context.params.per_page,
  });

  const contentListFound = results.rows;

  const secureContentValues = authorization.filterOutput(userTryingToGet, 'read:content:list', contentListFound);

  return {
    props: {
      contentListFound: JSON.parse(JSON.stringify(secureContentValues)),
      pagination: results.pagination,
      beta,
    },
    revalidate: 1,
  };
}
