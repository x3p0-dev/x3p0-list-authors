<?php
/**
 * Block class.
 *
 * Registers and renders the block type on the front end.
 *
 * @author    Justin Tadlock <justintadlock@gmail.com>
 * @copyright Copyright (c) 2022, Justin Tadlock
 * @link      https://github.com/x3p0-dev/x3p0-list-authors
 * @license   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 */

namespace X3P0\ListAuthors;

use WP_Block;
use WP_User_Query;

class Block
{
	private ?array $post_counts = null;

        /**
         * Sets up object state.
         *
         * @since 1.0.0
         */
        public function __construct( protected string $path ) {}

        /**
         * Boots the component, running its actions/filters.
         *
         * @since 1.0.0
         */
        public function boot(): void
        {
                add_action( 'init', [ $this, 'register' ] );
        }

	/**
	 * Registers the block with WordPress.
	 *
	 * @since 1.0.0
	 */
        public function register(): void
        {
                register_block_type( $this->path . '/public', [
                        'render_callback' => [ $this, 'render' ]
                ] );

		wp_localize_script(
			generate_block_asset_handle( 'x3p0/list-authors', 'editorScript' ),
			'x3p0ListAuthors',
			[ 'count' => $this->getPostCounts() ]
		);
        }

	/**
	 * Renders the block on the front end.
	 *
	 * @since 1.0.0
	 */
        public function render( array $attr, string $content, WP_Block $block ): string
        {
        	$attr = wp_parse_args( $attr, [
			'showFeed'    => false,
			'showPostCount' => true,
			'hideEmpty'   => false,
			'number'      => 10,
			'order'       => 'asc',
			'orderby'     => 'name'
        	] );

		$query_args = [
			'number'  => $attr['number'],
			'order'   => $attr['order'],
			'orderby' => $attr['orderby']
		];

		$counts = $this->getPostCounts();

		if ( $attr['hideEmpty'] ) {
			$query_args['include'] = array_keys( $counts );
		}

		// `wp_list_authors()` is a hot mess on output, making it hard
		// for themers to style it, so we're just rolling our own thing.
		$users = new WP_User_Query( $query_args );

		// Bail early if there are no results.
		if ( ! $users->results ) {
			return '';
		}

		$html = '';

		foreach ( $users->results as $user ) {
			$author = sprintf(
				'<a href="%s" class="wp-block-x3p0-list-authors__link">%s</a>',
				get_author_posts_url( $user->ID ),
				esc_html( $user->display_name )
			);

			if ( $attr['showFeed'] ) {
				$author .= sprintf(
					'<span class="wp-block-x3p0-list-authors__feed">(<a href="%s">%s</a>)</span>',
					get_author_feed_link( $user->ID ),
					__( 'Feed', 'x3p0-list-authors' )
				);
			}

			if ( $attr['showPostCount'] ) {
				$author .= sprintf(
					'<span class="wp-block-x3p0-list-authors__count">(%s)</span>',
					isset( $counts[ $user->ID ] ) ? absint( $counts[ $user->ID ] ) : 0
				);
			}

			$html .= sprintf(
				'<li class="wp-block-x3p0-list-authors__item"><div class="wp-block-x3p0-list-authors__content">%s</div></li>',
				$author
			);
		}

		// Return the formatted block output.
                return sprintf(
                        '<div %s><ul class="wp-block-x3p0-list-authors__list">%s</ul></div>',
                        get_block_wrapper_attributes(),
			$html
                );
        }

	/**
	 * Returns an array of user IDs (keys) with number of posts published
	 * (values).  Users without posts are not returned.
	 *
	 * @since 1.0.0
	 */
	private function getPostCounts(): array
	{
		global $wpdb;

		if ( ! is_null( $this->post_counts ) ) {
			return $this->post_counts;
		}

		// @todo Cache this, bust on `save_post`.
		$this->post_counts = [];

		foreach ( (array) $wpdb->get_results( "SELECT DISTINCT post_author, COUNT(ID) AS count FROM $wpdb->posts WHERE " . get_private_posts_cap_sql( 'post' ) . ' GROUP BY post_author' ) as $row ) {
			$this->post_counts[ $row->post_author ] = $row->count;
		}

		return $this->post_counts;
	}
}
