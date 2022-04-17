/**
 * Block edit.
 *
 * @author    Justin Tadlock <justintadlock@gmail.com>
 * @copyright Copyright (c) 2022, Justin Tadlock
 * @link      https://github.com/x3p0-dev/x3p0-list-authors
 * @license   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 */

// Localized script with authors data.
const { count } = x3p0ListAuthors;

// WordPress dependencies.
import {
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';

import {
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl
} from '@wordpress/components';

import { store }     from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ }        from '@wordpress/i18n';

/**
 * Exports the block edit function.
 *
 * @since 1.0.0
 */
export default function Edit( {
	attributes: {
		number,
		order,
		orderby,
		showFeed,
		showPostCount,
		hideEmpty
	},
	setAttributes
} ) {
	// Get users based on the attributes.
	const users = useSelect( ( select ) => {
		const { getUsers, getUser } = select( store );

		const queryArgs = {
			per_page: number,
			context:  'view',
			order:    order,
			orderby:  orderby
		};

		// If hiding empty, specifically include authors with posts.
		if ( true === hideEmpty ) {
			queryArgs.include = Object.keys( count );
		}

		const users = getUsers( queryArgs );

		// Add the post count to the user object.
		if ( users ) {
			users.map( ( user ) => {
				user.count = typeof count[ user.id ] !== 'undefined' ? count[ user.id ] : 0;
			} );
		}

		return users ?? [];
	}, [
		// Attributes that update the query when changed.
		number,
		order,
		orderby,
		hideEmpty
	] );

	const blockProps = useBlockProps();

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'List settings', 'x3p0-list-authors' ) }>
				<RangeControl
					label={ __( 'Number', 'x3p0-list-authors' ) }
					value={ number }
					onChange={ ( value ) => setAttributes( {
						number: value
					} ) }
					min="1"
					max="100"
					allowReset={ true }
					initialPosition={ 10 }
					resetFallbackValue={ 10 }
				/>
				<SelectControl
					label={ __( 'Order By', 'x3p0-list-authors' ) }
					selected={ orderby }
					onChange={ ( value ) => setAttributes( {
						orderby: value
					} ) }
					options={ [
						{ value: "name",            label: __( 'Name',            'x3p0-list-authors' ) },
						{ value: "slug",            label: __( 'Slug',            'x3p0-list-authors' ) },
						{ value: "email",           label: __( 'Email',           'x3p0-list-authors' ) },
						{ value: "id",              label: __( 'ID',              'x3p0-list-authors' ) },
						{ value: "registered_date", label: __( 'Registered Date', 'x3p0-list-authors' ) }
					] }
				/>
				<SelectControl
					label={ __( 'Order', 'x3p0-list-authors' ) }
					selected={ order }
					onChange={ ( value ) =>
						setAttributes( { order: value } )
					}
					options={ [
						{ value: "asc",  label: __( 'Ascending',  'x3p0-list-authors' ) },
						{ value: "desc", label: __( 'Descending', 'x3p0-list-authors' ) }
					] }
				/>
				<ToggleControl
					label={ __( 'Hide authors without posts', 'x3po-list-users' ) }
					checked={ hideEmpty }
					onChange={ ( value ) => setAttributes( {
						hideEmpty: value
					} ) }
				/>
				<ToggleControl
					label={ __( 'Show feed link', 'x3po-list-users' ) }
					checked={ showFeed }
					onChange={ ( value ) => setAttributes( {
						showFeed: value
					} ) }
				/>
				<ToggleControl
					label={ __( 'Show post count', 'x3po-list-users' ) }
					checked={ showPostCount }
					onChange={ ( value ) => setAttributes( {
						showPostCount: value
					} ) }
				/>
			</PanelBody>
		</InspectorControls>
	);

	const feedLink = ( <a
		href="#author-feed-pseudo-link"
		onClick={ ( event ) => event.preventDefault() }
	>{ __( 'Feed', 'x3p0-list-authors' ) }</a> );

	return (
		<>
			{ inspectorControls }
			<div { ...blockProps }>
				<ul className="wp-block-x3p0-list-authors__list">
					{ users.map( ( user ) => (
						<li
							className="wp-block-x3p0-list-authors__item"
						>
						<div className="wp-block-x3p0-list-authors__content">
						<a
							className="wp-block-x3p0-list-authors__link"
							href={ user.link }
							onClick={ ( event ) => event.preventDefault() }
						>{ user.name }</a>
						{ showFeed
							? <span className="wp-block-x3p0-list-authors__feed">({ feedLink })</span>
							: ''
						}
						{ showPostCount
							? <span className="wp-block-x3p0-list-authors__count">({ user.count })</span>
							: ''
						}
						</div>
						</li>
					) ) }
				</ul>
			</div>
		</>
	);
}
